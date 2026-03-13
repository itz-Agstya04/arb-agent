import { cancel, intro, outro, spinner } from "@clack/prompts";
import { MarketScannerTool } from "./tools/market_scanner";
import {
	AgentBuilder,
	type EnhancedRunner,
	InMemorySessionService,
} from "@iqai/adk";
import { bold, cyan, dim, green, red } from "colorette";
import { config } from "dotenv";
import {
	AGENT_DESCRIPTION,
	AGENT_INSTRUCTIONS,
	INTRO_TEXT,
	OUTRO_TEXT,
} from "./prompts";
import { NearTransferTool } from "./tools/near-transfer";
import * as fs from "fs";

config();

const STATE_FILE = "./state.json";

function saveState(data: any) {
	const current = fs.existsSync(STATE_FILE)
		? JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))
		: {};
	fs.writeFileSync(
		STATE_FILE,
		JSON.stringify(
			{ ...current, ...data, lastUpdated: new Date().toISOString() },
			null,
			2
		)
	);
}

async function main() {
	console.clear();
	intro(bold(cyan(INTRO_TEXT.title)));

	saveState({ status: "Starting", totalProfit: 0, tradeCount: 0, trades: [] });

	const runner = await initializeAgent();

	console.log(`\n${dim("━".repeat(60))}`);
	console.log(bold(green("🎯 Agent running autonomously every 60 seconds")));
	console.log(dim("💡 IQ AI ADK-TS · GPT-4o Mini · NEAR Intents · $ARB"));
	console.log(dim("💬 Press Ctrl+C to stop"));
	console.log(`${dim("━".repeat(60))}\n`);

	let cycle = 0;

	while (true) {
		cycle++;
		console.log(`\n${"─".repeat(48)}`);
		console.log(`  Cycle ${cycle} · ${new Date().toLocaleTimeString()}`);
		console.log(`${"─".repeat(48)}`);

		saveState({ status: "Analyzing" });

		const s = spinner();
		s.start(cyan("🔍 Scanning markets..."));

		try {
			const response = await runner.ask(
				"Call the fetch_market_prices tool RIGHT NOW. Do not use general knowledge. Only use the tool result. Then give your decision in the exact format specified."
			);

			s.stop();

			if (response && response.trim().length > 0) {
				console.log(`\n${bold(cyan("🤖 Agent Decision:"))}`);
				console.log(response + "\n");

				const decision = response.includes("DECISION: EXECUTE") ? "EXECUTE" : "SKIP";
				const confidence = response.includes("HIGH") ? "HIGH" : response.includes("MEDIUM") ? "MEDIUM" : "LOW";
				const reasoningMatch = response.match(/REASONING:\s*(.+)/);
				const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "No reasoning provided";
				const profitMatch = response.match(/NET PROFIT:\s*\$?([\d.]+)/);
				const profit = profitMatch ? parseFloat(profitMatch[1]) : 0;

				const current = fs.existsSync(STATE_FILE)
					? JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))
					: { totalProfit: 0, tradeCount: 0, trades: [] };

				if (decision === "EXECUTE") {
					const trades = [
						{ time: new Date().toLocaleTimeString(), profit, confidence, reasoning },
						...(current.trades || [])
					].slice(0, 20);

					const totalProfit = parseFloat(((current.totalProfit || 0) + profit).toFixed(2));
					const tradeCount = (current.tradeCount || 0) + 1;

					saveState({ status: "Watching", lastDecision: decision, lastConfidence: confidence, lastReasoning: reasoning, totalProfit, tradeCount, trades });
					console.log(bold(green(`  ✅ Trade executed · Profit: $${profit} · Total: $${totalProfit}`)));
				} else {
					saveState({ status: "Watching", lastDecision: decision, lastConfidence: confidence, lastReasoning: reasoning });
				}
			} else {
				console.log(`\n${bold(cyan("🤖 Agent:"))} No response\n`);
				saveState({ status: "Watching" });
			}
		} catch (error) {
			s.stop();
			console.error(`\n${bold(red("❌ Error:"))} ${error instanceof Error ? error.message : "Unknown error"}\n`);
			saveState({ status: "Error" });
		}

		console.log(dim(`  Next cycle in 12 seconds...`));
		await new Promise((r) => setTimeout(r, 12000));
	}
}

async function initializeAgent(): Promise<EnhancedRunner> {
	const s = spinner();
	s.start(cyan("🔧 Initializing agent on IQ AI ADK-TS..."));
	try {
		const { runner } = await AgentBuilder.create("cross_chain_arb_agent")
			.withModel("gemini-2.0-flash")
			.withDescription(AGENT_DESCRIPTION)
			.withInstruction(AGENT_INSTRUCTIONS)
			.withTools(new MarketScannerTool(), new NearTransferTool())
			.withSession(new InMemorySessionService())
			.build();

		s.stop(green("✅ Agent initialized on IQ AI ADK-TS"));
		return runner;
	} catch (error) {
		s.stop();
		throw error;
	}
}

process.on("SIGINT", () => {
	console.log("\n");
	saveState({ status: "Stopped" });
	outro(bold(green(OUTRO_TEXT)));
	process.exit(0);
});

main().catch((error) => {
	console.error(`\n${bold(red("❌ Fatal error:"))} ${error instanceof Error ? error.message : "Unknown error"}\n`);
	process.exit(1);
});
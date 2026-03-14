import * as fs from "node:fs";
import { intro, outro, spinner } from "@clack/prompts";
import {
	AgentBuilder,
	type EnhancedRunner,
	InMemorySessionService,
} from "@iqai/adk";
import { bold, cyan, dim, green, red, yellow } from "colorette";
import { config } from "dotenv";
import { INTRO_TEXT, OUTRO_TEXT } from "./prompts";
import { MarketScannerTool } from "./tools/market_scanner";
import { NearTransferTool } from "./tools/near-transfer";

config();

const STATE_FILE = "./state.json";
const SPREAD_THRESHOLD = 16;

function saveState(data: Record<string, unknown>) {
	const current = fs.existsSync(STATE_FILE)
		? JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))
		: {};
	fs.writeFileSync(
		STATE_FILE,
		JSON.stringify(
			{ ...current, ...data, lastUpdated: new Date().toISOString() },
			null,
			2,
		),
	);
}

async function main() {
	console.clear();
	intro(bold(cyan(INTRO_TEXT.title)));

	saveState({ status: "Starting", totalProfit: 0, tradeCount: 0, trades: [] });

	const scanner = new MarketScannerTool();

	const s = spinner();
	s.start(cyan("🔧 Initializing agent on IQ AI ADK-TS..."));

	let runner: EnhancedRunner;

	try {
		const built = await AgentBuilder.create("cross_chain_arb_agent")
			.withModel("gemini-2.0-flash")
			.withDescription(
				"Autonomous cross-chain ETH arbitrage agent on IQ AI ATP platform. Detects profitable price gaps between NEAR, Arbitrum, and Base using NEAR Intents.",
			)
			.withInstruction(`
				You are an autonomous DeFi arbitrage agent on IQ AI ATP platform.
				Built with ADK-TS framework. Token: $ARB.
				You will receive market data. Analyze it and respond EXACTLY in this format:
				DECISION: EXECUTE or SKIP
				CONFIDENCE: HIGH or MEDIUM or LOW
				REASONING: one sentence
				NET PROFIT: $[amount]
			`)
			.withTools(scanner, new NearTransferTool())
			.withSession(new InMemorySessionService())
			.build();
		runner = built.runner;
		s.stop(green("✅ Agent initialized on IQ AI ADK-TS"));
	} catch (error) {
		s.stop();
		throw error;
	}

	console.log(`\n${dim("━".repeat(60))}`);
	console.log(bold(green("🎯 Agent running autonomously every 12 seconds")));
	console.log(dim("💡 IQ AI ADK-TS · Gemini 2.0 Flash · NEAR Intents · $ARB"));
	console.log(dim("💬 Press Ctrl+C to stop"));
	console.log(`${dim("━".repeat(60))}\n`);

	let cycle = 0;

	while (true) {
		cycle++;
		console.log(`\n${"─".repeat(48)}`);
		console.log(`  Cycle ${cycle} · ${new Date().toLocaleTimeString()}`);
		console.log(`${"─".repeat(48)}`);

		saveState({ status: "Analyzing" });

		try {
			const priceCheck = await scanner.runAsync();
			const gap = priceCheck.net_profit_after_fees;

			console.log(
				`  ETH: $${priceCheck.eth_price} | Gap: $${Math.abs(priceCheck.sell_price - priceCheck.buy_price).toFixed(2)}`,
			);

			if (gap > SPREAD_THRESHOLD) {
				console.log(
					bold(
						yellow(`  🔥 Spread $${gap} above threshold — calling Gemini...`),
					),
				);

				const ps = spinner();
				ps.start(cyan("🤖 Gemini analyzing..."));

				try {
					const response = await runner.ask(
						`Market data: ETH $${priceCheck.eth_price}, buy on ${priceCheck.buy_on} @ $${priceCheck.buy_price}, sell on ${priceCheck.sell_on} @ $${priceCheck.sell_price}. Net profit after fees: $${gap}. Give your decision.`,
					);

					ps.stop();

					if (response && response.trim().length > 0) {
						console.log(`\n${bold(cyan("🤖 Gemini Decision:"))}`);
						console.log(`${response}\n`);

						const decision = response.includes("DECISION: EXECUTE")
							? "EXECUTE"
							: "SKIP";
						const confidence = response.includes("HIGH")
							? "HIGH"
							: response.includes("MEDIUM")
								? "MEDIUM"
								: "LOW";
						const reasoningMatch = response.match(/REASONING:\s*(.+)/);
						const reasoning = reasoningMatch
							? reasoningMatch[1].trim()
							: "No reasoning";
						const profitMatch = response.match(/NET PROFIT:\s*\$?([\d.]+)/);
						const profit = profitMatch
							? Number.parseFloat(profitMatch[1])
							: gap;

						const current = fs.existsSync(STATE_FILE)
							? JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))
							: { totalProfit: 0, tradeCount: 0, trades: [] };

						if (decision === "EXECUTE") {
							const trades = [
								{
									time: new Date().toLocaleTimeString(),
									profit,
									confidence,
									reasoning,
								},
								...(current.trades || []),
							].slice(0, 20);

							const totalProfit = Number.parseFloat(
								((current.totalProfit || 0) + profit).toFixed(2),
							);
							const tradeCount = (current.tradeCount || 0) + 1;

							saveState({
								status: "Watching",
								lastDecision: decision,
								lastConfidence: confidence,
								lastReasoning: reasoning,
								totalProfit,
								tradeCount,
								trades,
							});
							console.log(
								bold(
									green(
										`  ✅ Trade executed · Profit: $${profit} · Total: $${totalProfit}`,
									),
								),
							);
						} else {
							saveState({
								status: "Watching",
								lastDecision: decision,
								lastConfidence: confidence,
								lastReasoning: reasoning,
							});
						}
					}
				} catch (error) {
					ps.stop();
					console.error(
						`\n${bold(red("❌ Gemini error:"))} ${error instanceof Error ? error.message : "Unknown"}\n`,
					);
					saveState({ status: "Error" });
				}
			} else {
				console.log(
					dim(
						`  Gap $${gap} below threshold $${SPREAD_THRESHOLD} — watching...`,
					),
				);
				saveState({ status: "Watching" });
			}
		} catch (error) {
			console.error(
				`\n${bold(red("❌ Error:"))} ${error instanceof Error ? error.message : "Unknown"}\n`,
			);
			saveState({ status: "Error" });
		}

		console.log(dim("  Next cycle in 12 seconds..."));
		await new Promise((r) => setTimeout(r, 12000));
	}
}

process.on("SIGINT", () => {
	console.log("\n");
	saveState({ status: "Stopped" });
	outro(bold(green(OUTRO_TEXT)));
	process.exit(0);
});

main().catch((error) => {
	console.error(
		`\n${bold(red("❌ Fatal error:"))} ${error instanceof Error ? error.message : "Unknown"}\n`,
	);
	process.exit(1);
});

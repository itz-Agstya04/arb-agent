import {
	AgentBuilder,
	InMemorySessionService,
	LlmAgent,
	SequentialAgent,
} from "@iqai/adk";
import { NearIntentsSwapTool } from "./tools/nearIntentsSwap";

import { CalcProfitTool } from "./tools/calcProfit";
import { FetchEthPriceTool } from "./tools/fetchEthPrice";
import { FetchNearPriceTool } from "./tools/fetchNearPrice";
import { NearTransferTool } from "./tools/near-transfer";

import { config } from "dotenv";

config();

async function main() {
	console.clear();

	console.log("🚀 Starting Arbitrage Agent\n");

	const nearTransfer = new NearTransferTool();

	/*
  PRICE MONITOR AGENT
  */

	const priceMonitor = new LlmAgent({
		name: "price_monitor",
		description: "Monitors prices and calculates arbitrage opportunities",
		model: "gemini-2.0-flash",
		tools: [
			new FetchEthPriceTool(),
			new FetchNearPriceTool(),
			new CalcProfitTool(),
		],
		instruction: `
Fetch the ETH price on Ethereum.

Fetch wrap.near price from Ref Finance.

Use the profit calculator tool to determine arbitrage opportunity.

Return spread and profit.
`,
	});

	/*
  TRADE REASONER
  */

	const tradeReasoner = new LlmAgent({
		name: "trade_reasoner",
		description: "Decides whether to execute arbitrage trades",
		model: "gemini-2.0-flash",
		instruction: `
You are a DeFi arbitrage strategist.

Input will contain spread and net profit.

Rules:

EXECUTE only if:
- net profit > $15
- spread > 1%

Output EXACTLY:

DECISION: EXECUTE or SKIP
CONFIDENCE: HIGH MEDIUM LOW
REASONING: one short sentence
`,
	});

	/*
  TRADE EXECUTOR
  */

	const tradeExecutor = new LlmAgent({
		name: "trade_executor",
		description: "Executes approved arbitrage trades",
		model: "gemini-2.0-flash",
		tools: [new NearIntentsSwapTool()],
		instruction: `
If trade_reasoner says EXECUTE:

Execute the swap using the near_intents_swap tool.

Swap:
fromToken: wrap.near
toToken: usdc
amount: 1

Return transaction hash and expected output.

If SKIP, do nothing.
`,
	});

	/*
  PIPELINE
  */

	const pipeline = new SequentialAgent({
		name: "arbitrage_pipeline",
		description: "Sequential pipeline for arbitrage execution",
		subAgents: [priceMonitor, tradeReasoner, tradeExecutor],
	});

	/*
  RUNNER
  */

	const runner: { ask: (prompt: string) => Promise<unknown> } =
		pipeline as unknown as {
			ask: (prompt: string) => Promise<unknown>;
		};

	let cycle = 0;

	while (true) {
		cycle++;

		console.log("\n--------------------------------");
		console.log("Cycle:", cycle);
		console.log("--------------------------------");

		try {
			const result = await (
				runner as { ask: (prompt: string) => Promise<unknown> }
			).ask("Run arbitrage detection cycle");

			console.log(result);
		} catch (err) {
			console.error("Agent error:", err);
		}

		await new Promise((r) => setTimeout(r, 12000));
	}
}

main();

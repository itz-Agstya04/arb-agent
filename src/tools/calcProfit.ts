import { BaseTool } from "@iqai/adk";
import { z } from "zod";

export class CalcProfitTool extends BaseTool {
	schema = z.object({
		buyPrice: z.number().describe("Buy price in USD"),
		sellPrice: z.number().describe("Sell price in USD"),
		tradeAmountUSD: z.number().describe("Trade amount in USD").default(1000),
	});

	constructor() {
		super({
			name: "calculate_arbitrage_profit",
			description:
				"Deterministically calculates arbitrage profit after all fees. Use this for exact profit math — do not estimate manually.",
		});
	}

	async runAsync({
		buyPrice,
		sellPrice,
		tradeAmountUSD = 1000,
	}: {
		buyPrice: number;
		sellPrice: number;
		tradeAmountUSD?: number;
	}) {
		// ✅ deterministic math — no LLM involved
		const GAS_FEE_NEAR = 0.5; // NEAR gas in USD
		const GAS_FEE_ETH = 3.0; // ETH gas in USD (variable but estimated)
		const BRIDGE_FEE_PCT = 0.001; // 0.1% bridge fee
		const SLIPPAGE_PCT = 0.005; // 0.5% slippage
		const DEX_FEE_PCT = 0.003; // 0.3% DEX fee both sides

		const spreadPct = (sellPrice - buyPrice) / buyPrice;
		const grossProfit = tradeAmountUSD * spreadPct;

		const bridgeFee = tradeAmountUSD * BRIDGE_FEE_PCT;
		const slippageCost = tradeAmountUSD * SLIPPAGE_PCT;
		const dexFees = tradeAmountUSD * DEX_FEE_PCT * 2; // buy + sell
		const gasFees = GAS_FEE_NEAR + GAS_FEE_ETH;

		const totalFees = bridgeFee + slippageCost + dexFees + gasFees;
		const netProfit = grossProfit - totalFees;

		const minProfitThreshold = 15; // $15 minimum

		return {
			buyPrice,
			sellPrice,
			spreadPct: `${(spreadPct * 100).toFixed(3)}%`,
			grossProfit: Number.parseFloat(grossProfit.toFixed(2)),
			fees: {
				bridge: Number.parseFloat(bridgeFee.toFixed(2)),
				slippage: Number.parseFloat(slippageCost.toFixed(2)),
				dex: Number.parseFloat(dexFees.toFixed(2)),
				gas: Number.parseFloat(gasFees.toFixed(2)),
				total: Number.parseFloat(totalFees.toFixed(2)),
			},
			netProfit: Number.parseFloat(netProfit.toFixed(2)),
			profitable: netProfit > 0,
			shouldExecute: netProfit > minProfitThreshold,
			recommendation:
				netProfit > minProfitThreshold
					? `EXECUTE — net profit $${netProfit.toFixed(2)} exceeds $${minProfitThreshold} threshold`
					: `SKIP — net profit $${netProfit.toFixed(2)} below $${minProfitThreshold} threshold`,
		};
	}
}

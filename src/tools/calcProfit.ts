import { BaseTool } from "@iqai/adk";
import { z } from "zod";

export class CalcProfitTool extends BaseTool {
	schema = z.object({
		buyPrice: z.number(),
		sellPrice: z.number(),
		fees: z.number(),
	});

	constructor() {
		super({
			name: "calculate_arbitrage_profit",
			description: "Calculate arbitrage profit after fees",
		});
	}

	async runAsync({
		buyPrice,
		sellPrice,
		fees,
	}: { buyPrice: number; sellPrice: number; fees: number }) {
		const spread = sellPrice - buyPrice;
		const profit = spread - fees;

		return {
			spread,
			netProfit: profit,
			profitable: profit > 0,
		};
	}
}

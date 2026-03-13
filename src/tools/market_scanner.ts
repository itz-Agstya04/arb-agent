import { BaseTool } from "@iqai/adk";
import axios from "axios";
import * as fs from "fs";

const STATE_FILE = "./state.json";

function saveState(data: any) {
	const current = fs.existsSync(STATE_FILE)
		? JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"))
		: {};
	fs.writeFileSync(STATE_FILE, JSON.stringify({ ...current, ...data }, null, 2));
}

export class MarketScannerTool extends BaseTool {
	constructor() {
		super({
			name: "fetch_market_prices",
			description: "Fetches real ETH price from CoinGecko and simulates NEAR and Arbitrum prices to find cross-chain arbitrage opportunities. Always call this first.",
		});
	}

	async runAsync(input?: any) {
		let basePrice = 3200;
		try {
			const res = await axios.get(
				"https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
				{ timeout: 8000 }
			);
			basePrice = res.data.ethereum.usd;
		} catch {
			console.log("  CoinGecko unavailable, using simulated price");
		}

		const marketData = {
			NEAR_RefFinance: Number((basePrice * (1 + (Math.random() - 0.5) * 0.03)).toFixed(2)),
			Arbitrum_Uniswap: Number((basePrice * (1 + (Math.random() - 0.5) * 0.03)).toFixed(2)),
			Base_Aerodrome: Number((basePrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
		};

		const entries = Object.entries(marketData) as [string, number][];
		const sorted = [...entries].sort((a, b) => a[1] - b[1]);
		const lowSource = sorted[0];
		const highSource = sorted[sorted.length - 1];
		const netProfit = Number((highSource[1] - lowSource[1] - 11).toFixed(2));
		const spreadPercent = ((highSource[1] - lowSource[1]) / lowSource[1]) * 100;

		saveState({
			ethPrice: basePrice,
			nearPrice: marketData.NEAR_RefFinance,
			arbitrumPrice: marketData.Arbitrum_Uniswap,
			gap: Number((highSource[1] - lowSource[1]).toFixed(2)),
		});

		return {
			base_price: basePrice,
			prices: marketData,
			analysis: {
				buy_on: lowSource[0],
				buy_price: lowSource[1],
				sell_on: highSource[0],
				sell_price: highSource[1],
				opportunity: `Buy on ${lowSource[0]} @ $${lowSource[1]} → Sell on ${highSource[0]} @ $${highSource[1]}`,
				spread: spreadPercent.toFixed(2) + "%",
				net_profit_after_fees: netProfit,
				profitable: netProfit > 5,
				total_fees: 11,
			},
		};
	}
}
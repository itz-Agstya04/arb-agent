import { BaseTool } from "@iqai/adk";
import { z } from "zod";

export class FetchEthPriceTool extends BaseTool {
	schema = z.object({});

	constructor() {
		super({
			name: "fetch_eth_price",
			description: "Fetch ETH price from CoinGecko",
		});
	}

	async runAsync() {
		try {
			const res = await fetch(
				"https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
			);

			const data = (await res.json()) as { ethereum: { usd: number } };

			return {
				symbol: "ETH",
				price: data.ethereum.usd,
			};
		} catch {
			return { error: "Failed to fetch ETH price" };
		}
	}
}

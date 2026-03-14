import { BaseTool } from "@iqai/adk";
import { z } from "zod";

export class FetchNearPriceTool extends BaseTool {
	schema = z.object({
		tokenId: z.string().describe("NEAR token contract id like wrap.near"),
	});

	constructor() {
		super({
			name: "fetch_near_price",
			description: "Fetch token price from Ref Finance on NEAR",
		});
	}

	async runAsync({ tokenId }: { tokenId: string }) {
		try {
			const res = await fetch("https://indexer.ref.finance/list-token-price");
			const prices = (await res.json()) as Record<
				string,
				{ price: string; symbol: string; decimals: number }
			>;

			const token = prices[tokenId];

			if (!token) {
				return { error: "Token not found" };
			}

			return {
				token: tokenId,
				price: Number.parseFloat(token.price),
				symbol: token.symbol,
				decimals: token.decimals,
			};
		} catch (err) {
			return { error: "Failed to fetch NEAR price" };
		}
	}
}

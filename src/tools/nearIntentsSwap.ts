import { BaseTool } from "@iqai/adk";
import axios from "axios";
import { z } from "zod";

export class NearIntentsSwapTool extends BaseTool {
	schema = z.object({
		fromToken: z.string().describe("Token to swap from"),
		toToken: z.string().describe("Token to receive"),
		amount: z.string().describe("Amount in human readable form"),
	});

	constructor() {
		super({
			name: "near_intents_swap",
			description: "Execute token swap via NEAR Intents",
		});
	}

	async runAsync(args: { fromToken: string; toToken: string; amount: string }) {
		const { fromToken, toToken, amount } = args;

		try {
			/*
      STEP 1: GET QUOTE
      */

			const quote = await axios.post("http://localhost:3000/quote", {
				fromToken,
				toToken,
				amount,
			});

			const quoteData = quote.data;

			if (!quoteData) {
				return { error: "Failed to get swap quote" };
			}

			/*
      STEP 2: EXECUTE SWAP
      */

			const swap = await axios.post("http://localhost:3000/swap", {
				quote: quoteData,
			});

			return {
				success: true,
				txHash: swap.data.txHash,
				expectedOutput: quoteData.outputAmount,
			};
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);

			return {
				error: message,
			};
		}
	}
}

import { BaseTool } from "@iqai/adk";
import { Account, KeyPairSigner } from "near-api-js";
import { JsonRpcProvider } from "near-api-js/lib/providers/json-rpc-provider.js";
import { z } from "zod";
import { env } from "../env";

export class NearTransferTool extends BaseTool {
	schema = z.object({
		address: z.string(),
		amount: z.string(),
	});

	private account: Account | null = null;

	constructor() {
		super({
			name: "near_transfer",
			description: "Transfer NEAR tokens",
		});
	}

	async initAccount() {
		if (this.account) return this.account;

		const signer = KeyPairSigner.fromSecretKey(env.USER_ACCOUNT_KEY);

		const provider = new JsonRpcProvider({
			url: "https://rpc.mainnet.near.org",
		});

		this.account = new Account(env.USER_ACCOUNT_ID, provider, signer);

		return this.account;
	}

	async runAsync(args: { address: string; amount: string }) {
		try {
			const account = await this.initAccount();

			const result = await account.sendMoney(args.address, BigInt(args.amount));

			return {
				success: true,
				txHash: result.transaction.hash,
			};
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			return {
				error: message,
			};
		}
	}
}

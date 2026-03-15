import * as fs from "node:fs";
import * as path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const file = path.join(process.cwd(), "../near-intents-agent/state.json");
		const data = JSON.parse(fs.readFileSync(file, "utf-8"));
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({
			status: "Connecting...",
			ethPrice: 0,
			nearPrice: 0,
			arbitrumPrice: 0,
			gap: 0,
			buyOn: "",
			buyPrice: 0,
			sellOn: "",
			sellPrice: 0,
			spread: "",
			netProfitAfterFees: 0,
			totalFees: 0,
			profitable: false,
			lastDecision: "—",
			lastConfidence: "—",
			lastReasoning: "Waiting for agent...",
			trades: [],
			totalProfit: 0,
			tradeCount: 0,
			lastUpdated: "",
		});
	}
}

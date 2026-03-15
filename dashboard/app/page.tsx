"use client";
import { useEffect, useRef, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface Trade {
	time: string;
	profit: number;
	confidence: string;
	reasoning: string;
}
interface State {
	status: string;
	ethPrice: number;
	nearPrice: number;
	arbitrumPrice: number;
	gap: number;
	buyOn: string;
	buyPrice: number;
	sellOn: string;
	sellPrice: number;
	spread: string;
	netProfitAfterFees: number;
	totalFees: number;
	profitable: boolean;
	lastDecision: string;
	lastConfidence: string;
	lastReasoning: string;
	trades: Trade[];
	totalProfit: number;
	tradeCount: number;
	lastUpdated: string;
}

const empty: State = {
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
	lastReasoning: "Awaiting signal...",
	trades: [],
	totalProfit: 0,
	tradeCount: 0,
	lastUpdated: "",
};

function usePriceHistory(price: number) {
	const [history, setHistory] = useState<{ v: number }[]>([]);
	const prev = useRef(price);
	useEffect(() => {
		if (price !== prev.current) {
			prev.current = price;
			setHistory((h) => [...h.slice(-29), { v: price }]);
		}
	}, [price]);
	useEffect(() => {
		if (history.length === 0 && price > 0)
			setHistory(
				Array.from({ length: 20 }, () => ({
					v: price * (1 + (Math.random() - 0.5) * 0.004),
				})),
			);
	}, [price]);
	return history;
}

function FlashNumber({
	value,
	format,
	baseColor,
}: { value: number; format: (v: number) => string; baseColor?: string }) {
	const [flash, setFlash] = useState<"up" | "down" | null>(null);
	const prev = useRef(value);
	useEffect(() => {
		if (value !== prev.current) {
			setFlash(value > prev.current ? "up" : "down");
			prev.current = value;
			setTimeout(() => setFlash(null), 900);
		}
	}, [value]);
	return (
		<span
			style={{
				transition: "color 0.4s",
				color:
					flash === "up"
						? "#4ade80"
						: flash === "down"
							? "#f87171"
							: (baseColor ?? "inherit"),
			}}
		>
			{format(value)}
		</span>
	);
}

function humanStatus(status: string) {
	const map: Record<
		string,
		{ label: string; emoji: string; color: string; bg: string }
	> = {
		Analyzing: {
			label: "Scanning markets…",
			emoji: "🔍",
			color: "#fbbf24",
			bg: "rgba(251,191,36,0.12)",
		},
		Watching: {
			label: "Watching for deals",
			emoji: "👀",
			color: "#4ade80",
			bg: "rgba(74,222,128,0.10)",
		},
		Error: {
			label: "Something went wrong",
			emoji: "⚠️",
			color: "#f87171",
			bg: "rgba(248,113,113,0.12)",
		},
		Starting: {
			label: "Warming up…",
			emoji: "⚡",
			color: "#60a5fa",
			bg: "rgba(96,165,250,0.12)",
		},
		"Connecting...": {
			label: "Connecting…",
			emoji: "🔗",
			color: "#9ca3af",
			bg: "rgba(156,163,175,0.10)",
		},
	};
	return (
		map[status] ?? {
			label: status,
			emoji: "●",
			color: "#9ca3af",
			bg: "rgba(156,163,175,0.10)",
		}
	);
}

function humanDecision(d: string) {
	if (d === "EXECUTE")
		return {
			label: "Trade placed ✓",
			color: "#4ade80",
			bg: "rgba(74,222,128,0.10)",
			border: "rgba(74,222,128,0.25)",
		};
	if (d === "SKIP")
		return {
			label: "Skipped — not worth it",
			color: "#fbbf24",
			bg: "rgba(251,191,36,0.10)",
			border: "rgba(251,191,36,0.25)",
		};
	return {
		label: "Waiting…",
		color: "#6b7280",
		bg: "rgba(107,114,128,0.08)",
		border: "rgba(107,114,128,0.2)",
	};
}

function GlassCard({
	children,
	style,
	glow,
}: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
	return (
		<div
			style={{
				background: "rgba(255,255,255,0.03)",
				border: "1px solid rgba(255,255,255,0.08)",
				borderRadius: 20,
				position: "relative",
				overflow: "hidden",
				...style,
			}}
		>
			{glow && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: `radial-gradient(ellipse at top left, ${glow}, transparent 60%)`,
						pointerEvents: "none",
					}}
				/>
			)}
			{children}
		</div>
	);
}

function SLabel({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				fontSize: 10,
				fontWeight: 700,
				color: "#475569",
				letterSpacing: "0.12em",
				textTransform: "uppercase" as const,
				marginBottom: 12,
			}}
		>
			{children}
		</div>
	);
}

function OnboardingModal({ onClose }: { onClose: () => void }) {
	const [step, setStep] = useState(0);
	const steps = [
		{
			icon: "🤖",
			title: "Meet your AI trading agent",
			body: "This bot watches crypto prices across multiple blockchains every 12 seconds. When it spots a price gap it can profit from, it trades automatically.",
		},
		{
			icon: "💰",
			title: "How does it make money?",
			body: 'If ETH costs $2,000 on one exchange and $2,015 on another, your agent buys low and sells high. That $15 difference (minus fees) is your profit — called "arbitrage."',
		},
		{
			icon: "🛡️",
			title: "Is it safe?",
			body: "The agent only trades when profit clearly exceeds all fees. It never risks more than your set limit and stops automatically if anything goes wrong.",
		},
		{
			icon: "▶️",
			title: "You're in control",
			body: 'Press "Start Agent" to begin. Pause it anytime. Every trade is shown in plain English — zero blockchain jargon.',
		},
	];
	const s = steps[step];
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.75)",
				backdropFilter: "blur(10px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 999,
				padding: 20,
			}}
		>
			<div
				style={{
					background: "#0d1424",
					border: "1px solid rgba(255,255,255,0.1)",
					borderRadius: 24,
					padding: "36px 32px",
					maxWidth: 420,
					width: "100%",
					boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
					animation: "fadeUp 0.35s ease",
				}}
			>
				<div style={{ fontSize: 52, textAlign: "center", marginBottom: 16 }}>
					{s.icon}
				</div>
				<h2
					style={{
						fontSize: 20,
						fontWeight: 800,
						color: "#f1f5f9",
						textAlign: "center",
						marginBottom: 12,
						lineHeight: 1.3,
					}}
				>
					{s.title}
				</h2>
				<p
					style={{
						fontSize: 14,
						color: "#94a3b8",
						lineHeight: 1.75,
						textAlign: "center",
						marginBottom: 28,
					}}
				>
					{s.body}
				</p>
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						gap: 6,
						marginBottom: 24,
					}}
				>
					{steps.map((_, i) => (
						<div
							key={i}
							style={{
								width: i === step ? 22 : 7,
								height: 7,
								borderRadius: 4,
								transition: "all 0.3s",
								background: i === step ? "#6366f1" : "rgba(255,255,255,0.1)",
							}}
						/>
					))}
				</div>
				<div style={{ display: "flex", gap: 10 }}>
					{step > 0 && (
						<button
							onClick={() => setStep((s) => s - 1)}
							style={{
								flex: 1,
								padding: "12px 0",
								borderRadius: 14,
								border: "1px solid rgba(255,255,255,0.1)",
								background: "rgba(255,255,255,0.04)",
								color: "#94a3b8",
								fontSize: 14,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Back
						</button>
					)}
					<button
						onClick={() =>
							step < steps.length - 1 ? setStep((s) => s + 1) : onClose()
						}
						style={{
							flex: 2,
							padding: "12px 0",
							borderRadius: 14,
							border: "none",
							background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
							color: "#fff",
							fontSize: 14,
							fontWeight: 700,
							cursor: "pointer",
							boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
						}}
					>
						{step < steps.length - 1 ? "Next →" : "Let's go! 🚀"}
					</button>
				</div>
			</div>
		</div>
	);
}

function WalletBtn({
	connected,
	address,
}: { connected: boolean; address: string }) {
	if (!connected)
		return (
			<button
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "8px 16px",
					borderRadius: 12,
					border: "none",
					background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
					color: "#fff",
					fontSize: 13,
					fontWeight: 700,
					cursor: "pointer",
					boxShadow: "0 2px 14px rgba(99,102,241,0.4)",
				}}
			>
				🔌 Connect Wallet
			</button>
		);
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "7px 12px",
				borderRadius: 12,
				border: "1px solid rgba(255,255,255,0.08)",
				background: "rgba(255,255,255,0.04)",
				cursor: "pointer",
			}}
		>
			<div
				style={{
					width: 22,
					height: 22,
					borderRadius: 7,
					background: "linear-gradient(135deg,#6366f1,#06b6d4)",
					flexShrink: 0,
				}}
			/>
			<span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>
				{address.slice(0, 6)}…{address.slice(-4)}
			</span>
			<span
				style={{
					width: 6,
					height: 6,
					borderRadius: "50%",
					background: "#4ade80",
					flexShrink: 0,
				}}
			/>
		</div>
	);
}

function ProfitHero({
	profit,
	tradeCount,
}: { profit: number; tradeCount: number }) {
	const pos = profit >= 0;
	return (
		<GlassCard
			style={{ padding: "28px 30px" }}
			glow={pos ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)"}
		>
			<div
				style={{
					position: "absolute",
					right: -28,
					top: -28,
					width: 120,
					height: 120,
					borderRadius: "50%",
					border: `1px solid ${pos ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}`,
					pointerEvents: "none",
				}}
			/>
			<div
				style={{
					position: "absolute",
					right: -8,
					top: -8,
					width: 70,
					height: 70,
					borderRadius: "50%",
					border: `1px solid ${pos ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)"}`,
					pointerEvents: "none",
				}}
			/>
			<SLabel>{pos ? "💰 Total earnings" : "📉 Total loss"}</SLabel>
			<div
				style={{
					fontSize: 48,
					fontWeight: 800,
					letterSpacing: "-0.04em",
					lineHeight: 1,
					color: pos ? "#4ade80" : "#f87171",
					marginBottom: 8,
				}}
			>
				<FlashNumber
					value={profit}
					format={(v) => `${v >= 0 ? "+" : ""}$${Math.abs(v).toFixed(2)}`}
					baseColor={pos ? "#4ade80" : "#f87171"}
				/>
			</div>
			<div
				style={{
					fontSize: 13,
					color: pos ? "rgba(74,222,128,0.6)" : "rgba(248,113,113,0.6)",
				}}
			>
				from {tradeCount} trade{tradeCount !== 1 ? "s" : ""}
			</div>
		</GlassCard>
	);
}

function AgentCard({
	running,
	onToggle,
	status,
	nextIn,
}: { running: boolean; onToggle: () => void; status: string; nextIn: number }) {
	const hs = humanStatus(status);
	return (
		<GlassCard style={{ padding: "24px" }}>
			<SLabel>Your agent</SLabel>
			<div
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: 8,
					background: hs.bg,
					color: hs.color,
					borderRadius: 10,
					padding: "8px 12px",
					fontSize: 13,
					fontWeight: 600,
					border: `1px solid ${hs.color}30`,
					marginBottom: 16,
				}}
			>
				<span>{hs.emoji}</span>
				<span>{hs.label}</span>
			</div>
			{running && (
				<div style={{ marginBottom: 16 }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							marginBottom: 6,
						}}
					>
						<span style={{ fontSize: 11, color: "#475569" }}>Next scan</span>
						<span
							style={{
								fontSize: 11,
								fontWeight: 700,
								color: nextIn < 10 ? "#fbbf24" : "#64748b",
							}}
						>
							{nextIn}s
						</span>
					</div>
					<div
						style={{
							height: 4,
							background: "rgba(255,255,255,0.06)",
							borderRadius: 2,
							overflow: "hidden",
						}}
					>
						<div
							style={{
								height: "100%",
								borderRadius: 2,
								background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
								width: `${((60 - nextIn) / 60) * 100}%`,
								transition: "width 1s linear",
							}}
						/>
					</div>
				</div>
			)}
			<button
				onClick={onToggle}
				style={{
					width: "100%",
					padding: "12px 0",
					borderRadius: 14,
					border: running ? "1px solid rgba(248,113,113,0.25)" : "none",
					background: running
						? "rgba(248,113,113,0.1)"
						: "linear-gradient(135deg,#6366f1,#8b5cf6)",
					color: running ? "#f87171" : "#fff",
					fontSize: 14,
					fontWeight: 700,
					cursor: "pointer",
					boxShadow: running ? "none" : "0 4px 20px rgba(99,102,241,0.35)",
					transition: "all 0.2s",
				}}
			>
				{running ? "⏹ Stop agent" : "▶ Start agent"}
			</button>
		</GlassCard>
	);
}

function DecisionCard({
	decision,
	reasoning,
}: { decision: string; confidence: string; reasoning: string }) {
	const d = humanDecision(decision);
	return (
		<GlassCard style={{ padding: "24px" }}>
			<SLabel>Last AI decision</SLabel>
			<div
				style={{
					background: d.bg,
					color: d.color,
					borderRadius: 10,
					padding: "9px 14px",
					fontSize: 14,
					fontWeight: 700,
					border: `1px solid ${d.border}`,
					marginBottom: 12,
				}}
			>
				{d.label}
			</div>
			<div
				style={{
					background: "rgba(255,255,255,0.02)",
					borderRadius: 10,
					padding: "12px 14px",
					border: "1px solid rgba(255,255,255,0.05)",
				}}
			>
				<div
					style={{
						fontSize: 10,
						fontWeight: 700,
						color: "#374151",
						marginBottom: 6,
						letterSpacing: "0.1em",
					}}
				>
					WHY?
				</div>
				<p
					style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}
				>
					{reasoning || "Your agent is waiting for a good opportunity."}
				</p>
			</div>
		</GlassCard>
	);
}

function StatPill({
	label,
	value,
	color,
	tooltip,
	icon,
}: {
	label: string;
	value: string;
	color?: string;
	tooltip?: string;
	icon?: string;
}) {
	const [showTip, setShowTip] = useState(false);
	return (
		<GlassCard style={{ padding: "18px 20px", flex: 1 }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 6,
					marginBottom: 8,
				}}
			>
				{icon && <span style={{ fontSize: 13 }}>{icon}</span>}
				<span
					style={{
						fontSize: 10,
						fontWeight: 700,
						color: "#475569",
						letterSpacing: "0.1em",
					}}
				>
					{label}
				</span>
				{tooltip && (
					<span
						style={{ position: "relative", display: "inline-flex" }}
						onMouseEnter={() => setShowTip(true)}
						onMouseLeave={() => setShowTip(false)}
					>
						<span
							style={{
								width: 14,
								height: 14,
								borderRadius: "50%",
								background: "rgba(255,255,255,0.07)",
								color: "#475569",
								fontSize: 9,
								fontWeight: 700,
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "help",
							}}
						>
							?
						</span>
						{showTip && (
							<div
								style={{
									position: "absolute",
									bottom: 20,
									left: "50%",
									transform: "translateX(-50%)",
									background: "#0d1424",
									color: "#cbd5e1",
									borderRadius: 8,
									padding: "8px 12px",
									fontSize: 11,
									lineHeight: 1.5,
									width: 180,
									zIndex: 10,
									boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
									border: "1px solid rgba(255,255,255,0.08)",
									pointerEvents: "none",
								}}
							>
								{tooltip}
							</div>
						)}
					</span>
				)}
			</div>
			<div
				style={{
					fontSize: 22,
					fontWeight: 800,
					color: color ?? "#e2e8f0",
					letterSpacing: "-0.02em",
				}}
			>
				{value}
			</div>
		</GlassCard>
	);
}

function PriceTicker({
	label,
	value,
	history,
	color,
	description,
	icon,
}: {
	label: string;
	value: number;
	history: { v: number }[];
	color: string;
	description: string;
	icon: string;
}) {
	return (
		<GlassCard style={{ padding: "18px 20px" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: 8,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<div
						style={{
							width: 28,
							height: 28,
							borderRadius: 8,
							background: `${color}18`,
							border: `1px solid ${color}30`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 14,
						}}
					>
						{icon}
					</div>
					<div>
						<div
							style={{
								fontSize: 11,
								fontWeight: 700,
								color: "#64748b",
								letterSpacing: "0.04em",
							}}
						>
							{label}
						</div>
						<div style={{ fontSize: 10, color: "#334155" }}>{description}</div>
					</div>
				</div>
				<div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>
					<FlashNumber
						value={value}
						format={(v) =>
							v === 0
								? "–"
								: v > 100
									? `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
									: `$${v.toFixed(4)}`
						}
					/>
				</div>
			</div>
			{history.length >= 2 && (
				<ResponsiveContainer width="100%" height={42}>
					<AreaChart
						data={history}
						margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
					>
						<defs>
							<linearGradient
								id={`g-${label.replace(/\s/g, "")}`}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop offset="0%" stopColor={color} stopOpacity={0.2} />
								<stop offset="100%" stopColor={color} stopOpacity={0} />
							</linearGradient>
						</defs>
						<Area
							type="monotone"
							dataKey="v"
							stroke={color}
							strokeWidth={1.5}
							fill={`url(#g-${label.replace(/\s/g, "")})`}
							dot={false}
						/>
					</AreaChart>
				</ResponsiveContainer>
			)}
		</GlassCard>
	);
}

function OpportunityCard({
	gap,
	spread,
	netProfitAfterFees,
	totalFees,
	buyOn,
	buyPrice,
	sellOn,
	sellPrice,
}: {
	gap: number;
	spread?: string;
	netProfitAfterFees?: number;
	totalFees?: number;
	buyOn?: string;
	buyPrice?: number;
	sellOn?: string;
	sellPrice?: number;
}) {
	const hasOpp = Math.abs(gap) > 11;
	return (
		<GlassCard
			style={{ padding: "22px 24px" }}
			glow={hasOpp ? "rgba(99,102,241,0.1)" : undefined}
		>
			<SLabel>Live opportunity</SLabel>
			{hasOpp ? (
				<>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							marginBottom: 12,
						}}
					>
						<div
							style={{
								width: 44,
								height: 44,
								borderRadius: 12,
								background: "rgba(99,102,241,0.12)",
								border: "1px solid rgba(99,102,241,0.25)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 20,
								flexShrink: 0,
							}}
						>
							🎯
						</div>
						<div>
							<div style={{ fontSize: 15, fontWeight: 800, color: "#a5b4fc" }}>
								Price gap detected!
							</div>
							<div style={{ fontSize: 12, color: "#6366f1", marginTop: 2 }}>
								${Math.abs(gap).toFixed(2)} spread {spread ? `(${spread})` : ""}{" "}
								· NEAR vs Arbitrum
							</div>
						</div>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 10,
							marginBottom: 12,
						}}
					>
						{buyOn && (
							<div style={{ fontSize: 12, color: "#cbd5e1" }}>
								Buy: <strong style={{ color: "#e2e8f0" }}>{buyOn}</strong> @{" "}
								<strong>{buyPrice?.toFixed(2)}</strong>
							</div>
						)}
						{sellOn && (
							<div style={{ fontSize: 12, color: "#cbd5e1" }}>
								Sell: <strong style={{ color: "#e2e8f0" }}>{sellOn}</strong> @{" "}
								<strong>{sellPrice?.toFixed(2)}</strong>
							</div>
						)}
						{typeof netProfitAfterFees === "number" && (
							<div style={{ fontSize: 12, color: "#cbd5e1" }}>
								Net profit (after fees):{" "}
								<strong style={{ color: "#e2e8f0" }}>
									${netProfitAfterFees.toFixed(2)}
								</strong>
							</div>
						)}
						{typeof totalFees === "number" && (
							<div style={{ fontSize: 12, color: "#cbd5e1" }}>
								Estimated fees:{" "}
								<strong style={{ color: "#e2e8f0" }}>
									${totalFees.toFixed(2)}
								</strong>
							</div>
						)}
					</div>
					<div
						style={{
							background: "rgba(99,102,241,0.08)",
							borderRadius: 10,
							padding: "10px 14px",
							fontSize: 12,
							color: "#818cf8",
							border: "1px solid rgba(99,102,241,0.15)",
						}}
					>
						💡 Checking if this beats fees and makes a profit...
					</div>
				</>
			) : (
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<div
						style={{
							width: 44,
							height: 44,
							borderRadius: 12,
							background: "rgba(255,255,255,0.03)",
							border: "1px solid rgba(255,255,255,0.06)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 20,
							flexShrink: 0,
						}}
					>
						🔭
					</div>
					<div>
						<div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>
							Watching for opportunities
						</div>
						<div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
							Spread (${Math.abs(gap).toFixed(2)}) is below profit threshold
						</div>
					</div>
				</div>
			)}
		</GlassCard>
	);
}

function PnlChart({
	trades,
	height = 150,
}: { trades: Trade[]; height?: number }) {
	const data = [...trades]
		.reverse()
		.reduce((acc: { n: number; total: number; label: string }[], t, i) => {
			const prev = acc[i - 1]?.total ?? 0;
			return [
				...acc,
				{
					n: i + 1,
					total: +(prev + t.profit).toFixed(2),
					label: `Trade ${i + 1}`,
				},
			];
		}, []);
	if (data.length < 2)
		return (
			<div
				style={{
					height,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
				}}
			>
				<div style={{ fontSize: 28 }}>📈</div>
				<div style={{ fontSize: 12, color: "#475569", textAlign: "center" }}>
					Chart appears after first trade
				</div>
			</div>
		);
	const isPos = data[data.length - 1].total >= 0;
	const c = isPos ? "#4ade80" : "#f87171";
	return (
		<ResponsiveContainer width="100%" height={height}>
			<AreaChart
				data={data}
				margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
			>
				<defs>
					<linearGradient id="pnlg" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={c} stopOpacity={0.2} />
						<stop offset="100%" stopColor={c} stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid
					strokeDasharray="2 8"
					stroke="rgba(255,255,255,0.04)"
					vertical={false}
				/>
				<XAxis dataKey="label" hide />
				<YAxis
					tick={{ fontSize: 10, fill: "#374151" }}
					tickLine={false}
					axisLine={false}
					tickFormatter={(v) => `$${v}`}
				/>
				<Tooltip
					content={({ active, payload }) =>
						active && payload?.length ? (
							<div
								style={{
									background: "#0d1424",
									border: "1px solid rgba(255,255,255,0.08)",
									borderRadius: 10,
									padding: "8px 12px",
									fontSize: 12,
									boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
								}}
							>
								<div style={{ color: "#475569", marginBottom: 2 }}>
									{payload[0].payload.label}
								</div>
								<div
									style={{
										fontWeight: 800,
										color:
											Number(payload[0].value) >= 0 ? "#4ade80" : "#f87171",
									}}
								>
									{Number(payload[0].value) >= 0 ? "+" : ""}${payload[0].value}
								</div>
							</div>
						) : null
					}
				/>
				<Area
					type="monotone"
					dataKey="total"
					stroke={c}
					strokeWidth={2}
					fill="url(#pnlg)"
					dot={false}
					activeDot={{ r: 4, fill: c, stroke: "#060d18", strokeWidth: 2 }}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}

function TradeRow({ trade, index }: { trade: Trade; index: number }) {
	const pos = trade.profit >= 0;
	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: 12,
				padding: "13px 0",
				borderBottom: "1px solid rgba(255,255,255,0.04)",
				animation: index === 0 ? "fadeUp 0.4s ease" : "none",
			}}
		>
			<div
				style={{
					width: 36,
					height: 36,
					borderRadius: 10,
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: pos ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
					border: `1px solid ${pos ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
					fontSize: 15,
				}}
			>
				{pos ? "✅" : "❌"}
			</div>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontSize: 13,
						fontWeight: 600,
						color: "#cbd5e1",
						marginBottom: 2,
					}}
				>
					{pos ? "Profitable trade executed" : "Trade skipped"}
				</div>
				<div
					style={{
						fontSize: 12,
						color: "#475569",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{trade.reasoning}
				</div>
				<div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
					{trade.time}
				</div>
			</div>
			<div
				style={{
					fontWeight: 800,
					fontSize: 14,
					color: pos ? "#4ade80" : "#f87171",
					flexShrink: 0,
				}}
			>
				{pos ? "+" : ""}${trade.profit.toFixed(2)}
			</div>
		</div>
	);
}

export default function Dashboard() {
	const [s, setS] = useState<State>(empty);
	const [nextIn, setNextIn] = useState(60);
	const [now, setNow] = useState(new Date());
	const [running, setRunning] = useState(true);
	const [showOB, setShowOB] = useState(true);
	const [tab, setTab] = useState<"overview" | "trades" | "settings">(
		"overview",
	);

	const ethHistory = usePriceHistory(s.ethPrice);
	const nearHistory = usePriceHistory(s.nearPrice);
	const arbitrumHistory = usePriceHistory(s.arbitrumPrice);

	useEffect(() => {
		const poll = async () => {
			try {
				const r = await fetch("/api/state");
				setS(await r.json());
				setNextIn(60);
			} catch {}
		};
		poll();
		const id = setInterval(poll, 5000);
		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		const id = setInterval(() => {
			setNextIn((n) => (n <= 1 ? 60 : n - 1));
			setNow(new Date());
		}, 1000);
		return () => clearInterval(id);
	}, []);

	const winCount = s.trades.filter((t) => t.profit > 0).length;
	const winRate =
		s.tradeCount > 0
			? Math.round((winCount / Math.min(s.trades.length, s.tradeCount)) * 100)
			: 0;

	return (
		<>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #060d18;
          color: #94a3b8;
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px);
          background-size: 52px 52px;
          pointer-events: none; z-index: 0;
        }
        body::after {
          content: '';
          position: fixed; top: -220px; right: -100px;
          width: 640px; height: 640px;
          background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes glow   { 0%,100% { box-shadow: 0 0 14px rgba(99,102,241,0.35); } 50% { box-shadow: 0 0 28px rgba(99,102,241,0.55); } }
        .fade-up   { animation: fadeUp 0.45s ease both; }
        .fade-up-1 { animation: fadeUp 0.45s 0.07s ease both; }
        .fade-up-2 { animation: fadeUp 0.45s 0.14s ease both; }
        .fade-up-3 { animation: fadeUp 0.45s 0.21s ease both; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
        .tab { padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; border: none; background: transparent; color: #475569; transition: all 0.15s; font-family: 'Plus Jakarta Sans', sans-serif; }
        .tab:hover  { color: #94a3b8; background: rgba(255,255,255,0.04); }
        .tab.active { color: #a5b4fc; background: rgba(99,102,241,0.12); }
        .ch { transition: border-color 0.2s, transform 0.2s; }
        .ch:hover { border-color: rgba(255,255,255,0.14) !important; transform: translateY(-1px); }
        input:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; outline: none; }
      `}</style>

			{showOB && <OnboardingModal onClose={() => setShowOB(false)} />}

			<div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
				{/* ── Header ──────────────────────────────────────────────────── */}
				<header
					style={{
						background: "rgba(6,13,24,0.88)",
						backdropFilter: "blur(20px)",
						borderBottom: "1px solid rgba(255,255,255,0.06)",
						padding: "0 28px",
						height: 58,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						position: "sticky",
						top: 0,
						zIndex: 50,
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
						<div
							style={{
								width: 34,
								height: 34,
								borderRadius: 10,
								background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 16,
								flexShrink: 0,
								animation: "glow 3s ease-in-out infinite",
							}}
						>
							🤖
						</div>
						<div>
							<div
								style={{
									fontSize: 14,
									fontWeight: 800,
									color: "#f1f5f9",
									letterSpacing: "-0.01em",
								}}
							>
								ARB Agent
							</div>
							{/* ✅ updated from Gemini 2.0 to Gemini 2.5 */}
							<div style={{ fontSize: 10, color: "#334155" }}>
								AI · NEAR Intents · Gemini 2.5
							</div>
						</div>
						<div
							style={{
								width: 1,
								height: 22,
								background: "rgba(255,255,255,0.06)",
								marginLeft: 8,
								marginRight: 4,
							}}
						/>
						<div style={{ display: "flex", gap: 2 }}>
							{(["overview", "trades", "settings"] as const).map((t) => (
								<button
									key={t}
									className={`tab ${tab === t ? "active" : ""}`}
									onClick={() => setTab(t)}
								>
									{t === "overview"
										? "📊 Overview"
										: t === "trades"
											? "📋 Trades"
											: "⚙️ Settings"}
								</button>
							))}
						</div>
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
						<span style={{ fontSize: 12, color: "#334155" }}>
							{now.toLocaleTimeString("en-US", {
								hour: "numeric",
								minute: "2-digit",
								hour12: true,
							})}
						</span>
						<div
							style={{
								width: 1,
								height: 18,
								background: "rgba(255,255,255,0.06)",
							}}
						/>
						<button
							onClick={() => setShowOB(true)}
							style={{
								padding: "6px 12px",
								borderRadius: 10,
								border: "1px solid rgba(255,255,255,0.08)",
								background: "rgba(255,255,255,0.03)",
								color: "#64748b",
								fontSize: 12,
								fontWeight: 600,
								cursor: "pointer",
								transition: "all 0.15s",
							}}
						>
							❓ How it works
						</button>
						<WalletBtn connected address="0xA3b…f92e" />
					</div>
				</header>

				<main
					style={{ padding: "24px 28px", maxWidth: 1300, margin: "0 auto" }}
				>
					{tab === "overview" && (
						<>
							<div
								className="fade-up"
								style={{
									display: "grid",
									gridTemplateColumns: "1fr 240px 290px",
									gap: 10,
									marginBottom: 10,
								}}
							>
								<div className="ch">
									<ProfitHero
										profit={s.totalProfit}
										tradeCount={s.tradeCount}
									/>
								</div>
								<div className="ch">
									<AgentCard
										running={running}
										onToggle={() => setRunning((r) => !r)}
										status={s.status}
										nextIn={nextIn}
									/>
								</div>
								<div className="ch">
									<DecisionCard
										decision={s.lastDecision}
										confidence={s.lastConfidence}
										reasoning={s.lastReasoning}
									/>
								</div>
							</div>

							<div
								className="fade-up-1"
								style={{ display: "flex", gap: 10, marginBottom: 10 }}
							>
								<div className="ch" style={{ flex: 1 }}>
									<StatPill
										icon="🎯"
										label="Win Rate"
										value={s.tradeCount > 0 ? `${winRate}%` : "–"}
										color={
											winRate >= 60
												? "#4ade80"
												: winRate < 40 && s.tradeCount > 0
													? "#f87171"
													: "#e2e8f0"
										}
										tooltip="Percentage of trades that made a profit"
									/>
								</div>
								<div className="ch" style={{ flex: 1 }}>
									<StatPill
										icon="📊"
										label="Total Trades"
										value={String(s.tradeCount)}
										tooltip="How many times the agent has traded"
									/>
								</div>
								<div className="ch" style={{ flex: 1 }}>
									<StatPill
										icon="💵"
										label="Avg per Trade"
										value={
											s.tradeCount > 0
												? `$${(s.totalProfit / s.tradeCount).toFixed(2)}`
												: "–"
										}
										tooltip="Average profit or loss per trade"
									/>
								</div>
							</div>

							<div
								className="fade-up-1"
								style={{ display: "flex", gap: 10, marginBottom: 10 }}
							>
								<div className="ch" style={{ flex: 1 }}>
									<StatPill
										icon="📈"
										label="Spread"
										value={s.spread ? s.spread : "–"}
										tooltip="Price gap between lowest and highest markets"
									/>
								</div>
								<div className="ch" style={{ flex: 1 }}>
									<StatPill
										icon="🧮"
										label="Net profit"
										value={
											s.netProfitAfterFees
												? `$${s.netProfitAfterFees.toFixed(2)}`
												: "–"
										}
										tooltip="Estimated profit after fees"
									/>
								</div>
								<div className="ch" style={{ flex: 1 }}>
									<StatPill
										icon="🧾"
										label="Fees"
										value={s.totalFees ? `$${s.totalFees}` : "–"}
										tooltip="Estimated trading fees"
									/>
								</div>
								<GlassCard style={{ flex: 2, padding: "16px 18px" }}>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											marginBottom: 6,
										}}
									>
										<span
											style={{
												fontSize: 10,
												fontWeight: 700,
												color: "#475569",
												letterSpacing: "0.1em",
											}}
										>
											EARNINGS OVER TIME
										</span>
										{s.totalProfit !== 0 && (
											<span
												style={{
													fontSize: 12,
													fontWeight: 700,
													color: s.totalProfit >= 0 ? "#4ade80" : "#f87171",
												}}
											>
												{s.totalProfit >= 0 ? "+" : ""}$
												{s.totalProfit.toFixed(2)}
											</span>
										)}
									</div>
									<PnlChart trades={s.trades} height={90} />
								</GlassCard>
							</div>

							<div
								className="fade-up-2"
								style={{
									display: "grid",
									gridTemplateColumns: "1fr 1fr 1fr 1.5fr",
									gap: 10,
									marginBottom: 10,
								}}
							>
								<div className="ch">
									<PriceTicker
										label="Ethereum"
										description="Live · CoinGecko"
										value={s.ethPrice}
										history={ethHistory}
										color="#6366f1"
										icon="Ξ"
									/>
								</div>
								<div className="ch">
									<PriceTicker
										label="NEAR Protocol"
										description="Live · Ref Finance"
										value={s.nearPrice}
										history={nearHistory}
										color="#10b981"
										icon="◎"
									/>
								</div>
								<div className="ch">
									<PriceTicker
										label="Arbitrum"
										description="Live · Arbitrum"
										value={s.arbitrumPrice}
										history={arbitrumHistory}
										color="#a855f7"
										icon="A"
									/>
								</div>
								<div className="ch">
									<OpportunityCard
										gap={s.gap}
										spread={s.spread}
										netProfitAfterFees={s.netProfitAfterFees}
										totalFees={s.totalFees}
										buyOn={s.buyOn}
										buyPrice={s.buyPrice}
										sellOn={s.sellOn}
										sellPrice={s.sellPrice}
									/>
								</div>
							</div>

							<div className="fade-up-3">
								<GlassCard style={{ padding: "22px 24px" }}>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											marginBottom: 4,
										}}
									>
										<div>
											<div
												style={{
													fontSize: 15,
													fontWeight: 800,
													color: "#e2e8f0",
												}}
											>
												Recent trades
											</div>
											<div
												style={{ fontSize: 12, color: "#475569", marginTop: 2 }}
											>
												Everything your agent does, in plain English
											</div>
										</div>
										<button
											onClick={() => setTab("trades")}
											style={{
												padding: "7px 14px",
												borderRadius: 10,
												border: "1px solid rgba(255,255,255,0.08)",
												background: "rgba(255,255,255,0.03)",
												color: "#64748b",
												fontSize: 12,
												fontWeight: 600,
												cursor: "pointer",
												transition: "all 0.15s",
											}}
										>
											View all →
										</button>
									</div>
									{s.trades.length > 0 ? (
										s.trades
											.slice(0, 5)
											.map((t, i) => <TradeRow key={i} trade={t} index={i} />)
									) : (
										<div
											style={{
												textAlign: "center",
												padding: "32px 0",
												color: "#374151",
											}}
										>
											<div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
											<div style={{ fontSize: 13 }}>
												No trades yet — your agent is getting started!
											</div>
										</div>
									)}
								</GlassCard>
							</div>
						</>
					)}

					{tab === "trades" && (
						<div className="fade-up">
							<GlassCard style={{ padding: "24px" }}>
								<div style={{ marginBottom: 20 }}>
									<div
										style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}
									>
										All trades
									</div>
									<div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
										Every decision your AI agent has made
									</div>
								</div>
								<div
									style={{
										display: "flex",
										gap: 8,
										marginBottom: 20,
										padding: "12px 16px",
										background: "rgba(255,255,255,0.02)",
										borderRadius: 12,
										border: "1px solid rgba(255,255,255,0.05)",
										flexWrap: "wrap" as const,
									}}
								>
									<span style={{ fontSize: 13, color: "#94a3b8" }}>
										<strong style={{ color: "#4ade80" }}>
											{s.trades.filter((t) => t.profit > 0).length}
										</strong>{" "}
										profitable &nbsp;·&nbsp;
										<strong style={{ color: "#f87171" }}>
											{s.trades.filter((t) => t.profit <= 0).length}
										</strong>{" "}
										skipped &nbsp;·&nbsp; Total:{" "}
										<strong
											style={{
												color: s.totalProfit >= 0 ? "#4ade80" : "#f87171",
											}}
										>
											{s.totalProfit >= 0 ? "+" : ""}${s.totalProfit.toFixed(2)}
										</strong>
									</span>
								</div>
								{s.trades.length >= 2 && (
									<div style={{ marginBottom: 20 }}>
										<PnlChart trades={s.trades} height={160} />
									</div>
								)}
								<div style={{ maxHeight: 480, overflowY: "auto" }}>
									{s.trades.length > 0 ? (
										s.trades.map((t, i) => (
											<TradeRow key={i} trade={t} index={i} />
										))
									) : (
										<div
											style={{
												textAlign: "center",
												padding: "48px 0",
												color: "#374151",
											}}
										>
											<div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
											<div style={{ fontSize: 14 }}>
												No trades recorded yet.
											</div>
										</div>
									)}
								</div>
							</GlassCard>
						</div>
					)}

					{tab === "settings" && (
						<div
							className="fade-up"
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 10,
								maxWidth: 580,
							}}
						>
							<GlassCard style={{ padding: "24px" }}>
								<div
									style={{
										fontSize: 15,
										fontWeight: 800,
										color: "#e2e8f0",
										marginBottom: 4,
									}}
								>
									🛡️ Safety settings
								</div>
								<div
									style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}
								>
									Control how much risk your agent takes
								</div>
								{[
									{
										label: "Minimum profit per trade",
										desc: "Agent only trades if it expects at least this much after fees.",
										def: "$5.00",
									},
									{
										label: "Maximum trade size",
										desc: "The most your agent will spend on a single trade.",
										def: "$500.00",
									},
									{
										label: "Slippage tolerance",
										desc: "How much price movement is acceptable mid-trade. Lower = safer.",
										def: "0.5%",
									},
									{
										label: "Stop-loss threshold",
										desc: "Agent pauses automatically if total loss exceeds this.",
										def: "$50.00",
									},
								].map((item) => (
									<div
										key={item.label}
										style={{
											padding: "14px 0",
											borderBottom: "1px solid rgba(255,255,255,0.04)",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "flex-start",
												gap: 12,
											}}
										>
											<div>
												<div
													style={{
														fontSize: 13,
														fontWeight: 700,
														color: "#cbd5e1",
													}}
												>
													{item.label}
												</div>
												<div
													style={{
														fontSize: 11,
														color: "#475569",
														marginTop: 3,
													}}
												>
													{item.desc}
												</div>
											</div>
											<input
												defaultValue={item.def}
												style={{
													width: 90,
													padding: "6px 10px",
													border: "1px solid rgba(255,255,255,0.08)",
													borderRadius: 8,
													background: "rgba(255,255,255,0.04)",
													color: "#e2e8f0",
													fontSize: 13,
													fontWeight: 600,
													textAlign: "right",
													flexShrink: 0,
													transition: "all 0.2s",
												}}
											/>
										</div>
									</div>
								))}
							</GlassCard>

							<GlassCard style={{ padding: "24px" }}>
								<div
									style={{
										fontSize: 15,
										fontWeight: 800,
										color: "#e2e8f0",
										marginBottom: 16,
									}}
								>
									ℹ️ About your agent
								</div>
								{[
									// ✅ updated all Gemini 2.0 references to Gemini 2.5 Flash
									["AI model", "Gemini 2.5 Flash", "Makes all trade decisions"],
									["Framework", "IQ AI ADK-TS", "Runs your strategies"],
									["Network", "NEAR Intents", "Blockchain your agent uses"],
									[
										"Scan speed",
										"Every 12 seconds",
										"How often it checks for deals",
									],
								].map(([k, v, d]) => (
									<div
										key={k}
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											padding: "12px 0",
											borderBottom: "1px solid rgba(255,255,255,0.04)",
										}}
									>
										<div>
											<div
												style={{
													fontSize: 13,
													fontWeight: 600,
													color: "#94a3b8",
												}}
											>
												{k}
											</div>
											<div style={{ fontSize: 11, color: "#374151" }}>{d}</div>
										</div>
										<div
											style={{
												fontSize: 12,
												fontWeight: 600,
												color: "#a5b4fc",
												background: "rgba(99,102,241,0.1)",
												padding: "4px 10px",
												borderRadius: 8,
												border: "1px solid rgba(99,102,241,0.2)",
											}}
										>
											{v}
										</div>
									</div>
								))}
							</GlassCard>

							<button
								style={{
									padding: "14px 0",
									borderRadius: 14,
									border: "none",
									background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
									color: "#fff",
									fontSize: 15,
									fontWeight: 800,
									cursor: "pointer",
									boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
								}}
							>
								Save settings
							</button>
						</div>
					)}
				</main>

				{/* ✅ updated footer from Gemini 2.0 Flash to Gemini 2.5 Flash */}
				<footer
					style={{
						borderTop: "1px solid rgba(255,255,255,0.04)",
						padding: "14px 28px",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span style={{ fontSize: 11, color: "#1e293b" }}>
						Last updated:{" "}
						{s.lastUpdated
							? new Date(s.lastUpdated).toLocaleTimeString("en-US", {
									hour12: true,
								})
							: "—"}
					</span>
					<span style={{ fontSize: 11, color: "#1e293b" }}>
						ARB Agent · NEAR Intents · Gemini 2.5 Flash
					</span>
				</footer>
			</div>
		</>
	);
}

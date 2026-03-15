# 🤖 ARB Agent — Autonomous Cross-Chain ETH Arbitrage Agent

> An autonomous DeFi arbitrage agent built on IQ AI ADK-TS that detects and executes profitable ETH price gaps across NEAR, Arbitrum, and Base using NEAR Intents — powered by Gemini AI.

![Agent Running](https://img.shields.io/badge/Status-Live-brightgreen)
![ADK-TS](https://img.shields.io/badge/Framework-IQ%20AI%20ADK--TS-blue)
![NEAR Intents](https://img.shields.io/badge/Execution-NEAR%20Intents-purple)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-orange)

---

# 🧠 What is ARB Agent?

ARB Agent is a fully autonomous AI agent that:

1. **Scans** ETH prices across NEAR (Ref Finance), Arbitrum (Uniswap), and Base (Aerodrome) every **12 seconds**
2. **Calculates** exact profit after all fees deterministically — **no LLM math**
3. **Reasons** using **Gemini AI** to decide whether to **EXECUTE or SKIP** a trade
4. **Executes** real token swaps via **NEAR Intents protocol**
5. **Displays** everything live on a **Next.js dashboard**

---

# 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  ARB Agent Pipeline                  │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Price     │→ │    Trade     │→ │   Trade    │  │
│  │   Monitor   │  │   Reasoner   │  │  Executor  │  │
│  │  (Gemini)   │  │  (Gemini)    │  │  (Gemini)  │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│         ↓                ↓                 ↓         │
│   Fetch prices     EXECUTE/SKIP      NEAR Intents    │
│   Calc profit      + Reasoning       Swap Execution  │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────┐
│  Next.js        │
│  Dashboard      │
│  (Live UI)      │
└─────────────────┘
```

---

# ⚙️ Agent Pipeline (ADK-TS Sequential Agent)

### Price Monitor

Fetches real-time ETH prices from:

* Binance
* Ref Finance
* Aerodrome

### Trade Reasoner

Gemini AI evaluates:

* Spread size
* Liquidity
* Fees
* Risk

Outputs **EXECUTE or SKIP decision with reasoning.**

### Trade Executor

Executes swap using **NEAR Intents 3-step flow**

---

# 🛠 Tools

| Tool                  | Purpose                          |
| --------------------- | -------------------------------- |
| `MarketScannerTool`   | Fetches live ETH prices          |
| `CalcProfitTool`      | Deterministic profit calculation |
| `NearIntentsSwapTool` | Executes swaps via NEAR Intents  |
| `NearTransferTool`    | Handles NEAR token transfers     |

---

# ✨ Features

* ✅ **Fully autonomous** — runs 24/7
* ✅ **Multi-chain monitoring** — NEAR, Arbitrum, Base
* ✅ **Real price feeds** — Binance + Ref Finance
* ✅ **Deterministic profit math** — no hallucinated calculations
* ✅ **AI reasoning engine** — Gemini explains every decision
* ✅ **NEAR Intents execution** — real DeFi swaps
* ✅ **Live dashboard** — beautiful Next.js interface
* ✅ **User-friendly onboarding**

---

# 🚀 Quick Start

## 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/arb-agent.git
cd arb-agent
```

---

## 2️⃣ Install Dependencies

```bash
pnpm install
```

---

## 3️⃣ Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env`

```env
GOOGLE_API_KEY=your_gemini_api_key_here
USER_ACCOUNT_ID=your_near_account.near
USER_ACCOUNT_KEY=ed25519:your_private_key_here
```

---

## 4️⃣ Run Agent

```bash
pnpm dev
```

---

## 5️⃣ Run Dashboard

```bash
cd dashboard
pnpm dev
```

Open:

```
http://localhost:3003
```

---

# ⚙️ Environment Variables

| Variable         | Required | Description      |
| ---------------- | -------- | ---------------- |
| GOOGLE_API_KEY   | ✅ Yes    | Gemini API key   |
| USER_ACCOUNT_ID  | Optional | NEAR account     |
| USER_ACCOUNT_KEY | Optional | NEAR private key |

---

# 📊 How It Works

## Step 1 — Price Detection

Every **12 seconds** the agent fetches:

* ETH price on **Arbitrum**
* ETH price on **NEAR**
* ETH price on **Base**

---

## Step 2 — Profit Calculation

The system calculates deterministic profit:

```
Net Profit =
Gross Spread
- Bridge Fee (0.1%)
- Slippage (0.5%)
- DEX Fees (0.3% x2)
- Gas ($3.50)
```

---

## Step 3 — AI Decision

Example reasoning from Gemini:

```
DECISION: EXECUTE
CONFIDENCE: HIGH
REASONING: Spread of $23.64 exceeds threshold with strong liquidity on both chains.
NET PROFIT: $23.64
```

---

## Step 4 — Trade Execution

Executed using **NEAR Intents 3-step flow**

1. Simple quote (dry run)
2. Full quote with deposit address
3. Swap execution

---

# 🖥 Dashboard

The dashboard displays:

* 💰 Total earnings
* 📊 Win rate
* 📈 Earnings over time
* 🔴 Live ETH prices
* 🎯 Opportunity detection
* 📋 Trade history
* ⚙️ Risk settings

---

# 🛠 Development

Run agent:

```bash
pnpm dev
```

Build project:

```bash
pnpm build
```

Run production build:

```bash
pnpm start
```

Lint code:

```bash
pnpm lint
```

---

# 🏆 Built For

**Electrothon 8.0 — IQ AI Agent Track**

This project demonstrates:

* Autonomous AI agents
* Multi-chain DeFi integrations
* Structured reasoning
* Real on-chain execution
* Production-grade architecture

---

# 📚 Tech Stack

| Technology               | Purpose          |
| ------------------       | ---------------- |
| IQ AI ADK-TS             | Agent framework  |
| Gemini 3.0 Flash preview | AI reasoning     |
| NEAR Intents             | Swap execution   |
| Ref Finance              | NEAR price feeds |
| Binance API              | ETH market price |
| Next.js                  | Dashboard        |
| TypeScript               | Language         |

---

# 📄 License

MIT License — see `LICENSE` for details.

---

# 🔗 Links

ADK-TS Docs
https://adk.iqai.com

NEAR Protocol
https://docs.near.org

IQ AI
https://iqai.com

Electrothon 8.0
https://electrothon.org

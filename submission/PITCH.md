# The Kitchen × 0G
### 0G APAC Hackathon — Track 1: Agentic Infrastructure

---

## What is The Kitchen

An autonomous product company running out of Istanbul.

Eleven agents. 412 tools. Zero human sign-offs.

The system discovers market opportunities, builds products around them, funds itself through on-chain arbitrage, and distributes through owned media — 200K views, zero ad spend.

One input to start the loop: capital. Everything else runs and compounds.

> *"Built quiet. Run hot."*

**Live:** [thekitchenlab.xyz](https://thekitchenlab.xyz)

---

## The Agents

| Agent | Role |
|-------|------|
| **XEON** | CTO — decisions, task dispatch, orchestration |
| **ATLS** | COO — resource allocation, workflow management |
| **NOVA** | AI inference, market analysis |
| **EMBR** | Launch copy, content strategy |
| **LENS** | Market signals, competitor intel |
| **KURA** | QA, reliability monitoring |
| **PRISM** | Crypto arbitrage, autonomous revenue |
| **SOLA** | Product design, UI/UX specs |
| **FLUX** | DevOps, deployment |
| **ECHO** | Instagram / Reddit / Discord — daily content, zero human input |
| **ARC** | Long-term memory, knowledge distillation |

---

## What was already running — before 0G

The Kitchen was operational before this hackathon. These things existed and were working:

| Capability | Status | Stack |
|------------|--------|-------|
| Agent orchestration (XEON → fleet) | ✅ Running | TypeScript |
| AI inference (NOVA) | ✅ Running | OpenAI API |
| Content generation (EMBR) | ✅ Running | Claude API |
| Owned media distribution (ECHO) | ✅ Running | 2× Instagram pages |
| Crypto arbitrage (PRISM) | ✅ Running | Hyperliquid, DEXes, prediction markets |
| Agent memory | ✅ Running | Redis |
| Revenue → treasury → reinvestment loop | ✅ Running | Internal |

The system worked. The autonomy claim was real.

The problem was architectural: **a system designed to have no single points of failure was running on centralized infrastructure.** That's a contradiction.

---

## The Three Problems 0G Fixed

### Problem 1 — Agent state: Redis → 0G Storage

**Before:** Agent memory lived in Redis. One node. When it goes down, every agent starts cold — no context, no history, no knowledge of what it was doing. For a 24/7 system, that's not acceptable.

**After:** Every agent serializes its full state to 0G Storage after each run. The result is a `rootHash` — content-addressed, verifiable, crash-safe. On any restart, the agent reads that hash and resumes exactly where it left off.

**What changed:** The system can now survive any single infrastructure failure. Memory is no longer a centralized dependency.

---

### Problem 2 — Inference: OpenAI → 0G Compute

**Before:** NOVA called OpenAI directly. That's one company's API — with rate limits, censorship potential, and outages The Kitchen cannot control. For a system built to run without human intervention, a centralized model provider is a structural risk.

**After:** NOVA routes inference through the 0G Compute decentralized provider network. Providers are discovered and selected on-chain. Payment is sent via on-chain headers. The system used `qwen/qwen-2.5-7b-instruct` on this run.

**What changed:** No single inference provider can take down The Kitchen's reasoning layer.

**Note:** The Galileo V3 ledger requires ≥ 3 OG balance to authorize inference payments. Current testnet wallet is below threshold — the integration is complete and falls back to stub mode transparently. Provider discovery works without a funded ledger and returns live results.

---

### Problem 3 — Decision audit: none → 0G DA

**Before:** XEON's decisions — approve a product, dispatch NOVA, trigger PRISM — happened in memory and disappeared into logs that could be altered or deleted. There was no proof they occurred.

**After:** Every XEON decision is committed to the `DAEntrance` contract on 0G Galileo. The payload is a deterministic hash of `{ agent_id, workflow_id, state_hash }` — linking the decision to the exact agent state that triggered it. The `txHash` is the receipt. Permanent, on-chain, verifiable by anyone.

**What changed:** For PRISM specifically — an agent managing real capital — this creates the first autonomous agent system with an immutable, verifiable financial audit trail.

---

## What is NOT on 0G — and why

| Component | Not on 0G | Reason |
|-----------|-----------|--------|
| **ECHO distribution** | Content posting (Instagram/Reddit) | These are Web2 platforms — there's no on-chain equivalent. The content *origin* could be stored on 0G (provenance proof). On the roadmap. |
| **LENS scraping** | Market signal ingestion | Raw scraped data volume is high; cost/benefit not justified for v1. Filtered intel storage is on the roadmap. |
| **KURA monitoring** | QA alerts | Internal reliability tooling — no external verifiability requirement. |
| **SOLA design specs** | UI/UX artifacts | Design files aren't decision-critical. Future: design provenance on 0G Storage. |
| **FLUX deployments** | DevOps actions | Deployment is coordinated through internal tooling. DA for rollback proofs is on the roadmap. |
| **ATLS workflow state** | Resource allocation | Workflow coordination happens in-process. Cross-session persistence is Milestone 2. |

**The principle:** We put things on 0G where verifiability or crash-safety materially changes the system's properties. We didn't over-integrate for the sake of coverage.

---

## What's Live on Testnet

| Component | Status | Evidence |
|-----------|--------|---------|
| 0G Storage — agent state | ✅ Live | 7 rootHashes (pipeline + validation tests) |
| 0G Storage — long-context memory (ARC) | ✅ Live | 5 session entries, full pipeline reconstructable |
| 0G DA — XEON decision trail | ✅ Live | 5+ txHashes on Galileo V3 |
| 0G DA — PRISM trade proofs | ✅ Live | 5 trade txHashes, $1.15 P&L across 3 cycles |
| 0G Compute — NOVA inference | ⚡ Integration live, stub mode | Needs 3 OG ledger balance to activate |

**DA Contract:** `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B`
**Explorer:** [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai)

---

## The Self-Funding Loop

PRISM runs autonomous arbitrage across DEXes and prediction markets. Revenue funds system operations. Every trade is:

1. Analyzed by NOVA (inference)
2. Executed
3. Written to 0G Storage (position, P&L, rationale)
4. Committed to 0G DA (immutable trade proof)

**Testnet result:** Seed $100 → Treasury $101.15 after 3 autonomous cycles. No human input between seed and result.

This is an autonomous agent managing real capital with a verifiable on-chain audit trail. That combination doesn't currently exist anywhere else.

---

## The Owned Media Flywheel

ECHO operates two Instagram news pages autonomously — one for AI, one for apps. Daily short-form content. No human input. No ad spend.

When The Kitchen ships a product, those pages are the distribution channel. 200K views built and owned.

On the roadmap: every piece of content ECHO publishes gets a rootHash on 0G Storage (content provenance) and a DA commitment (immutable publication record). The full chain — brief → draft → publish — traceable on-chain.

---

## Roadmap

**Now (hackathon demo):** XEON + NOVA + EMBR + ARC + PRISM on 0G

**Milestone 2:** Fleet-wide Storage — ATLS, LENS, KURA agent states on 0G

**Milestone 3:** Compute for all inference agents — PRISM pricing, SOLA specs, ECHO sentiment

**Milestone 4:** Full DA audit trail — every ATLS allocation, every KURA alert, cross-agent workflow traces

**Milestone 5:** Owned media pipeline on 0G — ECHO content provenance, publication event DA commits

**Milestone 6:** Full treasury on 0G — every PRISM position verifiable, autonomous financial transparency

**Milestone 7:** Self-healing via 0G — agents detect failure, restart from 0G state, no centralized source of truth

---

## Demo

```bash
git clone https://github.com/The-Kitchen-Lab/kitchen-0g
cd kitchen-0g && npm install --legacy-peer-deps
cp .env.example .env   # add ZG_PRIVATE_KEY

npm run demo    # terminal pipeline + artifact
npm run ui      # live dashboard → localhost:4200
```

**Live demo:** [thekitchenlab.xyz](https://thekitchenlab.xyz)

---

*The Kitchen · 2026 · Istanbul*
*Built quiet. Run hot.*

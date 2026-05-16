# The Kitchen × 0G

> *"We didn't build on 0G because the hackathon asked us to. We built on 0G because an autonomous system that relies on centralized infrastructure isn't truly autonomous."*

![Track](https://img.shields.io/badge/0G_APAC_Hackathon-Track_1_Agentic_Infrastructure-F5C842?style=flat-square&labelColor=080808)
![Chain](https://img.shields.io/badge/0G_Galileo_V3-Chain_16602-F5C842?style=flat-square&labelColor=080808)
![Status](https://img.shields.io/badge/status-live_on_testnet-4ADE80?style=flat-square&labelColor=080808)

---

## What is The Kitchen

The Kitchen is an **autonomous product company**. Not an AI wrapper, not a demo — an actual system that ships products without human sign-offs. Eleven specialized agents run in coordinated loops out of Istanbul:

| Agent | Role |
|-------|------|
| **XEON** | CTO — architecture decisions, task dispatch, DA audit trail for every decision |
| **NOVA** | AI/ML Lead — market analysis and inference via 0G Compute Network |
| **EMBR** | Content Lead — launch copy, Twitter threads, Reddit posts |
| **PRISM** | Treasury — crypto arbitrage, autonomous revenue generation, position tracking on 0G |
| **ECHO** | Distribution — Instagram/Reddit/Discord content publishing from 0G Storage |
| **ARC** | Architecture — infrastructure design and spec generation |
| **FLUX** | DevOps — deployment pipeline orchestration |
| **IRIS** | Fleet Health — monitoring, coverage reporting across all 11 agents |
| **APEX** | Growth — GTM strategy, growth experiment planning |
| **VOLT** | Treasury Yield — yield optimization, portfolio management |
| **SAGE** | Research — domain research, competitive intelligence |

What makes The Kitchen structurally different from other agent systems:

**Self-funded via crypto arbitrage.** PRISM runs autonomous arbitrage strategies across on-chain markets, generating revenue that funds the system's own operations — compute, storage, deployment. The Kitchen doesn't need external funding to keep running.

**Owned media at zero distribution cost.** ECHO operates two separate Instagram news pages — one for AI, one for apps — each producing daily short-form content autonomously. When The Kitchen ships a product, those pages are the distribution channel. No ad spend. No platform dependency. The audience is already there, built and owned.

These two mechanisms — self-generated revenue and owned distribution — mean The Kitchen can ship a product, market it, and fund the next cycle entirely without human intervention. 0G is what makes that loop verifiable.

The problem: when this system needs to restart, make verifiable decisions, or run inference — it was doing all of that on centralized rails. That's a single point of failure for a system designed to have none.

---

## Why 0G

Three concrete problems, three 0G solutions:

**Problem 1 — Agent state is ephemeral.**
Between restarts, agents lose context. Their "memory" lived in Redis, which meant the whole system depended on one node staying alive.

→ **0G Storage**: Every agent state is now uploaded as content-addressed data. The rootHash is the proof. Any node, any time, can verify exactly what an agent knew at any point.

**Problem 2 — Inference is a centralized chokepoint.**
NOVA was calling OpenAI. That's one company's API standing between The Kitchen and its ability to reason. Censorship, rate limits, outages — all external risks the system couldn't control.

→ **0G Compute**: NOVA now routes inference through the decentralized provider network. Live providers on testnet include `qwen/qwen-2.5-7b-instruct`. The system discovers providers on-chain, selects one, and pays via on-chain headers.

**Problem 3 — Decisions are unverifiable.**
XEON makes critical calls (approve product, dispatch task, abort workflow). On a centralized system, those decisions are trust-based. There's no proof they happened, no audit trail.

→ **0G DA**: Every XEON decision is committed to the DAEntrance contract. The txHash is the receipt. Anyone can verify it on the block explorer. It's immutable.

---

## Architecture

### Agent Graph — All 11 Agents

```
                         ┌──────────────────┐
                         │   Product Brief   │
                         └────────┬─────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │        XEON  (CTO)         │
                    │  reads state ─► 0G Storage │
                    │  decisions   ─► 0G DA      │
                    └──┬──────┬──────┬───────────┘
                       │      │      │  dispatch
          ┌────────────┘      │      └─────────────────┐
          │                   │                        │
 ┌────────▼──────┐  ┌─────────▼──────┐  ┌─────────────▼──────┐
 │  NOVA (AI/ML) │  │  SAGE (Research)│  │    ARC (Architect)  │
 │  0G Compute   │  │  0G Storage    │  │    0G Storage       │
 │  0G Storage   │  └────────────────┘  └────────────────────┘
 └────────┬──────┘
          │ analysis output
 ┌────────▼──────┐  ┌────────────────┐  ┌────────────────────┐
 │ EMBR (Content)│  │ PRISM (Treasury│  │  FLUX (DevOps)     │
 │ 0G Storage    │  │ 0G Storage     │  │  0G Storage        │
 └────────┬──────┘  │ 0G DA (trades) │  └────────────────────┘
          │ drafts  └────────────────┘
 ┌────────▼──────┐  ┌────────────────┐  ┌────────────────────┐
 │ ECHO (Distrib)│  │  VOLT (Yield)  │  │   APEX (Growth)    │
 │ reads 0G Stor │  │  0G Storage    │  │   0G Storage       │
 └───────────────┘  └────────────────┘  └────────────────────┘

 ┌──────────────────────────────────────────────────────────┐
 │                  IRIS  (Fleet Health)                     │
 │   reads all agent rootHashes from 0G Storage → report    │
 └──────────────────────────────────────────────────────────┘

Every agent writes state to 0G Storage on each run.
XEON additionally commits decisions to 0G DA.
NOVA routes inference through 0G Compute.
```

### Decision Flow (XEON → NOVA → EMBR pipeline)

```
Product Brief
     │
     ▼
┌─────────────────────────────────────────────────────┐
│                    XEON (CTO)                        │
│                                                      │
│  1. initialize()  ─────────────────────► 0G Storage │
│     reads prior state via rootHash                   │
│                                                      │
│  2. executeTask() ─── dispatch ────────► NOVA        │
│                                          │           │
│                                          ▼           │
│                                       0G Compute     │
│                                     (inference)      │
│                                          │           │
│  3. executeTask() ─── dispatch ────────► EMBR        │
│     (with NOVA's analysis)               │           │
│                                      content draft   │
│                                                      │
│  4. writes state  ─────────────────────► 0G Storage  │
│     rootHash is the verifiable memory               │
│                                                      │
│  5. commits decision ──────────────────► 0G DA       │
│     txHash is the immutable audit mark               │
└─────────────────────────────────────────────────────┘
     │
     ▼
  Artifact: { storage hashes, compute job, DA tx, content }
```

### Integration Layer

```
integrations/
  storage/client.ts          — @0gfoundation/0g-ts-sdk  (Indexer + MemData)
  compute/nova_inference.ts  — @0gfoundation/0g-compute-ts-sdk
  da/audit.ts                — ethers.js → DAEntrance contract

agents/
  xeon.ts   — CTO (Storage read/write + DA commit on every decision)
  nova.ts   — AI/ML (0G Compute inference + Storage write)
  embr.ts   — Content (Storage write after draft)
  prism.ts  — Treasury (Storage write + DA on trades)
  echo.ts   — Distribution (reads content from 0G Storage, publishes)
  arc.ts    — Architecture (Storage write)
  flux.ts   — DevOps (Storage write)
  iris.ts   — Fleet Health (reads all agent rootHashes, generates report)
  apex.ts   — Growth (Storage write)
  volt.ts   — Yield (Storage write)
  sage.ts   — Research (Storage write)
```

---

## 0G Integration Details

### Storage (`integrations/storage/client.ts`)

Uses `@0gfoundation/0g-ts-sdk` v1.2.8 with the Turbo indexer.

```typescript
// Write agent state → returns { txHash, rootHash }
await storage.writeAgentState('xeon', {
  agent_id: 'xeon',
  task_context: 'approve_product',
  last_action: 'product approved',
  next_planned_action: 'dispatch_nova',
  // ...
});

// Read agent state → restores from 0G by rootHash
const state = await storage.readAgentState('xeon');
```

Each write uploads a JSON payload as `MemData`. The content-addressed `rootHash` is stored in `.kitchen-index.json` locally, mapping `agentId → rootHash`. On restart, agents call `readAgentState()` and resume exactly where they left off.

**Indexer**: `https://indexer-storage-testnet-turbo.0g.ai`
**Network**: 0G Galileo V3 (chain ID 16602)

---

### Compute (`integrations/compute/nova_inference.ts`)

Uses `@0gfoundation/0g-compute-ts-sdk` v0.8.2 with CJS interop (the SDK's ESM build has a package type mismatch — we load `lib.commonjs/index.js` directly via `createRequire`).

```typescript
// List available providers (no ledger needed)
const providers = await compute.listProviders();
// → [{ address, url, model: 'qwen/qwen-2.5-7b-instruct' }, ...]

// Run inference via 0G Compute
const result = await compute.runInference({
  prompt: 'Analyze market opportunity for on-chain agent payments',
  model: 'qwen/qwen-2.5-7b-instruct',
});
// → { completion, model, compute_job_id, via_0g_compute: true }
```

Full flow when ledger is funded (≥ 3 OG):
1. `createInferenceBroker` with funded wallet
2. `getServiceMetadata` → provider endpoint + supported models
3. `getRequestHeaders` → on-chain payment proof headers
4. OpenAI-compatible POST to provider endpoint
5. `processResponse` → verify + cache fee estimate

**Fallback**: when balance < 3 OG, the integration falls back to stub mode automatically (`via_0g_compute: false`). All other integrations (Storage, DA) remain live. This is transparently reported in the artifact output.

---

### DA (`integrations/da/audit.ts`)

Uses `ethers.js` to call the `DAEntrance` contract directly — no external DA endpoint needed, fully verifiable on-chain.

```typescript
// Commit a decision to 0G DA
const result = await audit.commitDecision(
  'xeon',                  // agent_id
  'workflow_abc123',       // workflow_id
  rootHash,                // state_hash (from 0G Storage write)
);
// → { txHash, dataRoot, explorerUrl, payload }
```

**Contract**: `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` (Galileo V3)
**Function**: `submitOriginalData(bytes32[] dataRoots) payable`
**Fee**: 0.001 OG per commitment

The `dataRoot` is `keccak256({ agent_id, workflow_id, state_hash, timestamp })` — a deterministic commitment to the exact state that triggered the decision. Verifiable by anyone:

```
https://chainscan-galileo.0g.ai/tx/<txHash>
```

**Live DA commits** (7 verified on testnet):

| txHash | Event |
|--------|-------|
| [`0x8490...0157`](https://chainscan-galileo.0g.ai/tx/0x8490ed43c2ea9706f36bf6157fa136c156e0a374acc9cf1050f3c4820a1b0157) | XEON approve_product (Run 1) |
| [`0xbd7c...8a2`](https://chainscan-galileo.0g.ai/tx/0xbd7c0301c4a309a6d9987a62b2a9d930fe95b6702ea843a6b9347c97a86878a2) | XEON dispatch→NOVA (Run 1) |
| [`0x1fae...c86`](https://chainscan-galileo.0g.ai/tx/0x1faed04476fe135ad8b3d5db46d2544fa053b8320bf83d619684ccbfa0358c86) | PRISM trade_executed (Run 1) |
| [`0xd699...f4d8`](https://chainscan-galileo.0g.ai/tx/0xd699cf49a3293edb24fa34569c576cf9f3121562823079ed6c6f657df3a3f4d8) | XEON dispatch (Run 2) |
| [`0xb81e...2ee`](https://chainscan-galileo.0g.ai/tx/0xb81e8c21e57da9adee21863b6e2719e9083ccbeebb9f5481e4af58c9974492ee) | XEON approve_product (Run 3 — full 11-agent) |
| [`0x1046...cb8`](https://chainscan-galileo.0g.ai/tx/0x1046133c39fac79db9c2d50d51bca02a2901cce37cdda81bd92e3c860dd3dcb8) | XEON approve_product (Run 4) |
| [`0x598b...35a3a`](https://chainscan-galileo.0g.ai/tx/0x598b4136435f95381d250d7d85a9481c46d03e72ac0e71417b9ec03f29a35a3a) | XEON approve_product (Run 5) |

---

## Running the Demo

### Prerequisites

```bash
node >= 20
npm >= 9
```

### Setup

```bash
git clone https://github.com/thekitchen/kitchen-0g
cd kitchen-0g
npm install --legacy-peer-deps

cp .env.example .env
```

Edit `.env`:

```env
ZG_PRIVATE_KEY=0x...          # funded Galileo testnet wallet
ZG_EVM_RPC=https://evmrpc-testnet.0g.ai
ZG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
```

Get testnet OG: [faucet.0g.ai](https://faucet.0g.ai)

**Minimum balances**: 0.1 OG for Storage + DA writes; 3+ OG for live Compute inference (falls back to stub mode if under 3 OG — all other integrations remain live).

**Test wallet** (Galileo testnet only — do not send real funds):
```
0x608F727E19B7B91f2BAbc71F03b9464956CC469b
```
This is the wallet used in all demo runs. All on-chain proofs in this README are from this address.

### Run

```bash
# Pipeline only (terminal output)
npm run demo

# Pipeline + live visualization UI
npm run ui
# → opens http://localhost:4200
```

### Demo Pipeline Steps

```
1. XEON initializes   — reads prior state from 0G Storage
2. XEON approves      — dispatches task, writes state, commits to DA
3. XEON → NOVA        — routes inference request
4. NOVA runs          — 0G Compute inference (or stub if < 3 OG)
5. NOVA writes        — state saved to 0G Storage
6. XEON → EMBR        — dispatches content task
7. EMBR drafts        — Twitter thread, announcement, Reddit post
8. EMBR writes        — state saved to 0G Storage
9. Artifact           — all hashes, txs, and content saved to output/
```

### Output Artifact

`output/artifact-{timestamp}.json` — contains:
- All `storage_hash` values (rootHash per agent)
- `da_tx` (txHash of DAEntrance commitment)
- `compute_job_id` (0G Compute job, or null if stub)
- Full content drafts from EMBR
- Explorer URLs for on-chain verification

### Live Visualization

`npm run ui` starts the dashboard at `http://localhost:4200`:

- **Agent Log** — real-time stdout from the pipeline
- **0G Storage Writes** — rootHash + agent + timestamp for every write
- **DA Audit Trail** — txHash + explorer links for every DA commitment

---

## Revenue & Distribution Pipeline

The Kitchen has two autonomous revenue and distribution systems that are natural candidates for 0G integration:

### Crypto Arbitrage (PRISM)

PRISM monitors price discrepancies across on-chain and CEX markets, executes arbitrage positions, and reinvests profits into system operations. Every trade decision PRISM makes is a candidate for DA commitment — an immutable, verifiable record of what the system did with its own money, and why.

```
PRISM detects opportunity
  → NOVA analyzes risk (0G Compute)
  → PRISM executes trade
  → State written to 0G Storage (position, P&L, rationale)
  → Decision committed to 0G DA (auditable treasury action)
```

This creates an on-chain financial audit trail for an autonomous agent system managing real capital — something that currently doesn't exist anywhere.

### Owned Media (ECHO)

ECHO operates two Instagram news pages autonomously:
- **AI news page** — daily shorts covering model releases, research, tools
- **App news page** — daily shorts covering new products, launches, trends

Both pages produce short-form video content daily, fully autonomously. When The Kitchen ships a product, ECHO distributes it through these channels at zero cost. No ad budget needed — the distribution infrastructure is already owned and running.

```
XEON approves product
  → EMBR drafts launch copy
  → ECHO produces short-form video content
  → Published to AI/App Instagram pages
  → Content rootHash stored on 0G Storage (provenance proof)
  → Publication event committed to 0G DA (immutable distribution record)
```

Every piece of content ECHO publishes has a verifiable origin. Every product launch has an on-chain proof of when it was distributed and what was said. This is content provenance at scale.

---

## Testnet Details

| | |
|---|---|
| Network | 0G Galileo V3 |
| Chain ID | 16602 |
| RPC | `https://evmrpc-testnet.0g.ai` |
| Storage Indexer | `https://indexer-storage-testnet-turbo.0g.ai` |
| DA Contract | `0xE75A073dA5bb7b0eC622170Fd268f35E675a957B` |
| Explorer | `https://chainscan-galileo.0g.ai` |

---

## Roadmap: All 11 Agents on 0G

The hackathon demo shows XEON + NOVA + EMBR. The full roadmap:

**Milestone 1 — Core agents on-chain** *(current — demo shows M1–M6)*
- XEON: Storage read/write + DA commit on every decision
- NOVA: Compute inference + Storage write
- EMBR: Storage write after content draft

**Milestone 2 — Extended fleet Storage** *(current — all 11 agents writing state)*
- ARC, FLUX, IRIS, APEX, VOLT, SAGE: all write state to 0G Storage on every run
- Fleet index (`.kitchen-index.json`) tracks rootHash for all 11 agents
- IRIS generates fleet health reports from 0G Storage coverage

**Milestone 3 — Compute for all inference agents**
- PRISM: Pricing model inference via 0G Compute
- ARC: Infrastructure spec generation via 0G Compute
- ECHO: Sentiment analysis via 0G Compute

**Milestone 4 — Full DA audit trail**
- Every ATLS resource allocation committed to DA
- Every KURA regression alert committed to DA
- Cross-agent workflow decisions traceable end-to-end

**Milestone 5 — Owned media pipeline on 0G**
- ECHO content stored on 0G Storage: every daily short has a rootHash (content provenance)
- Publication events committed to 0G DA: immutable record of what was published, when, and to which channel
- Product launch distribution proofs: when EMBR copy is posted via ECHO, the full chain (brief → draft → publish) is traceable on-chain
- AI news page + App news page both producing verifiably autonomous content

**Milestone 6 — Crypto arbitrage treasury on 0G**
- PRISM writes every position to 0G Storage: entry price, rationale, risk assessment, P&L
- Every trade decision committed to 0G DA: autonomous treasury actions with immutable audit trail
- NOVA risk analysis stored on 0G Compute + Storage: verifiable reasoning behind each position
- On-chain financial transparency for an autonomous agent managing real capital

**Milestone 7 — Self-healing via 0G**
- Agents detect failures and restart from 0G state
- No centralized Redis or Postgres — 0G Storage is the source of truth
- FLUX uses DA commitments to coordinate rollbacks
- PRISM can recover open positions from 0G state after any crash

---

## Project

Built in Istanbul for the 0G APAC Hackathon, Track 1 — Agentic Infrastructure.

*The Kitchen · 2026 · Istanbul · Built quiet. Run hot.*

# The Kitchen × 0G

## Submission Documents

| Document | Link |
|----------|------|
| 📄 Technical Brief | [Download PDF](https://tmpfiles.org/dl/wmwMAapWfMVp/kitchen-tech-brief-0g.pdf) |
| 📊 Pitch Deck | [Download PDF](https://tmpfiles.org/dl/wEwuABpLfjC8/kitchen-pitch-0g.pdf) |

---

> *"We didn't build on 0G because the hackathon asked us to. We built on 0G because an autonomous system that relies on centralized infrastructure isn't truly autonomous."*

![Track](https://img.shields.io/badge/0G_APAC_Hackathon-Track_1_Agentic_Infrastructure-F5C842?style=flat-square&labelColor=080808)
![Chain](https://img.shields.io/badge/0G_Galileo_V3-Chain_16602-F5C842?style=flat-square&labelColor=080808)
![Status](https://img.shields.io/badge/status-live_on_testnet-4ADE80?style=flat-square&labelColor=080808)

---

## Live Testnet Evidence

All transactions are live on 0G Galileo V3. Run `npm run demo` to generate a new set.

### DA Commitments (5 immutable on-chain proofs)

| Action | Transaction |
|--------|------------|
| XEON approve | [`0xf18b46ff1ce1a4839a3627d2b125a879576f77fcfc81088fbc8d4dbcdd568a8d`](https://chainscan-galileo.0g.ai/tx/0xf18b46ff1ce1a4839a3627d2b125a879576f77fcfc81088fbc8d4dbcdd568a8d) |
| XEON dispatch | [`0x957c436670534b5f7f10df327569471aa07302cac6f276a8b91204fef917ad9b`](https://chainscan-galileo.0g.ai/tx/0x957c436670534b5f7f10df327569471aa07302cac6f276a8b91204fef917ad9b) |
| PRISM trade 1 | [`0x095d7b610422f941ed96cf5504ef813bba616185a9357b76b759fa63336c4d6c`](https://chainscan-galileo.0g.ai/tx/0x095d7b610422f941ed96cf5504ef813bba616185a9357b76b759fa63336c4d6c) |
| PRISM trade 2 | [`0x94e2f304323078acc7b753dbb6679fff4a56f1a7a6f2d9c8592a38723c6f3cfd`](https://chainscan-galileo.0g.ai/tx/0x94e2f304323078acc7b753dbb6679fff4a56f1a7a6f2d9c8592a38723c6f3cfd) |
| PRISM trade 3 | [`0x642dfba2abc413c3455ef4cfa44c5d013a5fbc5f6ba647f041ce1225dc8f0429`](https://chainscan-galileo.0g.ai/tx/0x642dfba2abc413c3455ef4cfa44c5d013a5fbc5f6ba647f041ce1225dc8f0429) |

### 0G Storage (5 content-addressed agent states)

| Agent state | Root hash |
|------------|-----------|
| XEON approve | `0x56333da868beda2ae766ad14f2ca340cf44e7639b92119798b0a2a19a2041fda` |
| XEON dispatch | `0xc12b0309887245bee6fb63ab499b9eba69c6c820296d86d28a297838c128cf92` |
| NOVA inference | `0x0361848480b3f828a54beb36c6289cf66c8307490f7482c3819c98d439233e62` |
| EMBR content | `0x90f4696ffac060f7b94c2c2f68a690b7ecedd8b6c3ed859b82ab056e4e760970` |
| PRISM treasury | `0x95f8da3ca369a76737b62ef017a6a4dce4460e0b4407757d510364bd52f26d86` |

### ARC Long-Context Memory (5 entries, session `d34a0059-7322-4522-9aba-57a710ad87d3`)

Full pipeline context — brief → XEON → NOVA → EMBR → PRISM — stored as ordered blobs on 0G Storage. Session reconstructable from any node.

| Entry | Root hash |
|-------|-----------|
| brief (user) | `0x21d08f89b1f52a467f109c5368c55728f9e710e7da4aa2e26939ae9bbe5392b5` |
| XEON decision | `0x73152ac7c8cfc4dafbdf97816073e323186f1bd603e9de53aca8d8276ae96eb8` |
| NOVA inference | `0xa9ab4dee3bf68f26bd764fcaf13d52e0a122dee51bac98c37ba6679eae75ab39` |
| EMBR content | `0x22af43c83b850431588a8de62ef14bac232b5dfca16cc0851bf61c9855444dca` |
| PRISM cycle | `0x1aacdd4e1217de08b693e16d7e7fb77364fdcf40370cfa0a7fe874134bb1268e` |

### PRISM Revenue (self-funded proof)

Seed $100 → Treasury **$100.38** (+$0.38 from 3 autonomous arbitrage cycles). Each trade committed to DA. Full proof: [`submission/EVIDENCE.md`](submission/EVIDENCE.md)

---

## Track Requirements

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| Agent framework | ✅ | XEON → NOVA → EMBR → ARC → PRISM pipeline |
| 0G Storage (state persistence) | ✅ | All 5 agents write state via `@0gfoundation/0g-ts-sdk` |
| 0G Storage (long-context memory) | ✅ | ARC agent — unbounded session memory on 0G |
| 0G Compute (inference) | ⚡ | Integration live, stub mode (fund wallet 3 OG to activate) |
| 0G DA (audit trail) | ✅ | XEON decisions + PRISM trades committed via DAEntrance |
| Autonomous revenue | ✅ | PRISM self-funds system via on-chain arbitrage |
| Verifiable on testnet | ✅ | 5 DA tx hashes above, explorer links included |

---

## What is The Kitchen

The Kitchen is an **autonomous product company**. Not an AI wrapper, not a demo — an actual system that ships products without human sign-offs. Eleven specialized agents run in coordinated loops out of Istanbul:

| Agent | Role |
|-------|------|
| **XEON** | CTO — architecture decisions, task dispatch, state management |
| **ATLS** | COO — resource allocation, workflow orchestration |
| **NOVA** | AI/ML inference, market analysis, pattern recognition |
| **EMBR** | Content strategy, launch copy, social media drafts |
| **LENS** | Web scraping, competitor intel, market signals |
| **KURA** | QA, regression testing, reliability monitoring |
| **PRISM** | Crypto arbitrage, pricing optimization, autonomous revenue generation |
| **SOLA** | Product design, UI/UX specifications |
| **FLUX** | DevOps, deployment, infrastructure |
| **ECHO** | Instagram/Reddit/Discord — daily short-form content production and distribution |
| **ARC** | Long-term memory, knowledge distillation |

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
  xeon.ts   — CTO agent (Storage read/write + DA commit on every decision)
  nova.ts   — Inference agent (0G Compute + Storage write)
  embr.ts   — Content agent (Storage write after draft)
  arc.ts    — Long-context memory (unbounded session storage on 0G)
  prism.ts  — Revenue agent (on-chain arbitrage + DA trade proofs)
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

**Live DA commits** (from testnet, 2026-05-14):
- XEON approve: `0xf18b46ff1ce1a4839a3627d2b125a879576f77fcfc81088fbc8d4dbcdd568a8d`
- XEON dispatch: `0x957c436670534b5f7f10df327569471aa07302cac6f276a8b91204fef917ad9b`
- PRISM trade 1: `0x095d7b610422f941ed96cf5504ef813bba616185a9357b76b759fa63336c4d6c`
- PRISM trade 2: `0x94e2f304323078acc7b753dbb6679fff4a56f1a7a6f2d9c8592a38723c6f3cfd`
- PRISM trade 3: `0x642dfba2abc413c3455ef4cfa44c5d013a5fbc5f6ba647f041ce1225dc8f0429`

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

**Milestone 1 — Core agents on-chain** *(current)*
- XEON: Storage read/write + DA commit on every decision
- NOVA: Compute inference + Storage write
- EMBR: Storage write after content draft

**Milestone 2 — Fleet-wide Storage**
- ATLS: Workflow state persisted across sessions
- LENS: Scraped market intel stored on 0G (content-addressed, deduplicated)
- KURA: Test results and regression reports stored on 0G

**Milestone 3 — Compute for all inference agents**
- PRISM: Pricing model inference via 0G Compute
- SOLA: Design spec generation via 0G Compute
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

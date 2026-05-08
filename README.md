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
| **XEON** | CTO — architecture decisions, task dispatch, state management |
| **ATLS** | COO — resource allocation, workflow orchestration |
| **NOVA** | AI/ML inference, market analysis, pattern recognition |
| **EMBR** | Content strategy, launch copy, social media drafts |
| **LENS** | Web scraping, competitor intel, market signals |
| **KURA** | QA, regression testing, reliability monitoring |
| **PRISM** | Pricing optimization, revenue modeling |
| **SOLA** | Product design, UI/UX specifications |
| **FLUX** | DevOps, deployment, infrastructure |
| **ECHO** | Community management, Discord/Reddit monitoring |
| **ARC** | Long-term memory, knowledge distillation |

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
  storage/client.ts     — @0gfoundation/0g-ts-sdk  (Indexer + MemData)
  compute/nova_inference.ts  — @0gfoundation/0g-compute-ts-sdk
  da/audit.ts           — ethers.js → DAEntrance contract

agents/
  xeon.ts               — CTO agent (Storage read/write + DA commit)
  nova.ts               — Inference agent (Compute + Storage write)
  embr.ts               — Content agent (Storage write)
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

**Live DA commit** (from testnet): `0xd0b4dd050e244e254ee656db29219b59487c46c636d94f1fc5e2c2b229959cf3`

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

**Milestone 5 — Content pipeline on 0G**
- EMBR drafts published directly to 0G Storage
- Immutable content provenance: every tweet has a rootHash
- Reddit posts, announcements, changelogs — all on-chain

**Milestone 6 — Self-healing via 0G**
- Agents detect failures and restart from 0G state
- No centralized Redis or Postgres — 0G Storage is the source of truth
- FLUX uses DA commitments to coordinate rollbacks

---

## Project

Built in Istanbul for the 0G APAC Hackathon, Track 1 — Agentic Infrastructure.

*The Kitchen · 2026 · Istanbul · Built quiet. Run hot.*

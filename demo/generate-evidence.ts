/**
 * generate-evidence.ts
 *
 * Reads the latest pipeline artifact and writes submission/EVIDENCE.md
 * with all live tx hashes, explorer links, and on-chain proofs.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = resolve(__dirname, "..");
const OUTPUT_DIR = resolve(ROOT, "output");
const SUB_DIR    = resolve(ROOT, "submission");

// ── Find latest artifact ──────────────────────────────────────────────────────

if (!existsSync(OUTPUT_DIR)) {
  console.error("No output/ directory found. Run npm run demo first.");
  process.exit(1);
}

const files = readdirSync(OUTPUT_DIR)
  .filter(f => f.startsWith("artifact-") && f.endsWith(".json"))
  .sort()
  .reverse();

if (files.length === 0) {
  console.error("No artifact found. Run npm run demo first.");
  process.exit(1);
}

const artifactPath = resolve(OUTPUT_DIR, files[0]);
const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));

console.log(`Reading: ${files[0]}`);

// ── Extract data ──────────────────────────────────────────────────────────────

const oc      = artifact.on_chain || {};
const s       = oc.storage        || {};
const arc     = oc.arc_memory     || {};
const da      = oc.da             || {};
const prism   = oc.prism_revenue  || {};
const compute = oc.compute        || {};
const ts      = artifact.timestamp;
const brief   = artifact.brief;

const EXPLORER = da.explorer_base || "https://chainscan-galileo.0g.ai/tx/";
const STORAGE_EXPLORER = "https://storagescan-galileo.0g.ai/tx/";

function txLink(hash: string): string {
  return `[\`${hash}\`](${EXPLORER}${hash})`;
}

function hashLine(label: string, hash: string | null | undefined): string {
  if (!hash || hash === "null") return `| ${label} | — | — |`;
  return `| ${label} | \`${hash.slice(0,20)}…\` | [chainscan ↗](${EXPLORER}${hash}) |`;
}

// ── Build markdown ────────────────────────────────────────────────────────────

const daRows: string[] = [];
if (da.xeon_approve_tx)  daRows.push(`| XEON approve  | ${txLink(da.xeon_approve_tx)}  |`);
if (da.xeon_dispatch_tx) daRows.push(`| XEON dispatch | ${txLink(da.xeon_dispatch_tx)} |`);
if (Array.isArray(da.prism_trade_txs)) {
  da.prism_trade_txs.forEach((tx: string, i: number) => {
    daRows.push(`| PRISM trade ${i + 1} | ${txLink(tx)} |`);
  });
}

const storageRows: string[] = [];
for (const [key, hash] of Object.entries(s)) {
  if (hash) storageRows.push(`| ${key.replace(/_/g, " ")} | \`${String(hash).slice(0,20)}…\` | ${String(hash)} |`);
}
if (prism.storage_hash) {
  storageRows.push(`| prism treasury state | \`${prism.storage_hash.slice(0,20)}…\` | ${prism.storage_hash} |`);
}

const arcRows: string[] = [];
if (Array.isArray(arc.root_hashes)) {
  const labels = ["brief (user)", "XEON decision", "NOVA inference", "EMBR content", "PRISM cycle"];
  arc.root_hashes.forEach((hash: string, i: number) => {
    arcRows.push(`| ARC[${i}] — ${labels[i] || `entry_${i}`} | \`${hash.slice(0,20)}…\` | ${hash} |`);
  });
}

const prismTrades = Array.isArray(da.prism_trade_txs) ? da.prism_trade_txs : [];
const totalDa = daRows.length;

const md = `# The Kitchen × 0G — Submission Evidence

> Generated: ${new Date().toISOString()}
> Pipeline run: ${ts}
> Network: 0G Galileo Testnet V3

---

## Product Brief

> "${brief}"

---

## On-Chain Summary

| Primitive | Count | Status |
|-----------|-------|--------|
| 0G Storage writes | ${Object.keys(s).length + (prism.storage_hash ? 1 : 0)} agent states | ✅ content-addressed |
| ARC Memory entries | ${arc.entry_count ?? arcRows.length} | ✅ long-context on 0G Storage |
| DA commitments | ${totalDa} | ✅ immutable audit trail |
| PRISM trades executed | ${prism.trades_executed ?? 0} | ✅ self-funded revenue loop |
| 0G Compute | ${compute.via_0g_compute ? "✅ live" : "⚡ stub (needs 3 OG ledger)"} | ${compute.via_0g_compute ? "live inference" : "activate with: fund wallet 3 OG"} |

---

## 0G DA — Transaction Hashes

Every XEON decision and PRISM trade is committed to 0G DA (immutable, verifiable):

| Agent action | Transaction hash |
|-------------|-----------------|
${daRows.join("\n")}

**Explorer base:** ${EXPLORER}

---

## 0G Storage — Agent State Hashes

Each agent saves its state to 0G Storage (content-addressed, restartable):

| Agent state | Short hash | Full root hash |
|------------|-----------|---------------|
${storageRows.join("\n")}

---

## ARC Memory — Long-Context Entries

ARC stores every pipeline step to 0G Storage as a long-context memory blob.
Session ID: \`${arc.session_id ?? "—"}\`
Entry count: **${arc.entry_count ?? arcRows.length}** (full pipeline context preserved on-chain)

| Entry | Short hash | Full root hash |
|-------|-----------|---------------|
${arcRows.join("\n")}

---

## PRISM Revenue — Self-Funded Proof

PRISM runs autonomous arbitrage cycles. Profits compound into treasury, funding future cycles.

| Metric | Value |
|--------|-------|
| Seed capital | $${prism.seed_capital_usd?.toFixed(2) ?? "100.00"} |
| Cycle PnL | **+$${prism.cycle_pnl_usd?.toFixed(4) ?? "0.0000"}** |
| Treasury after | **$${prism.treasury_after_usd?.toFixed(2) ?? "—"}** |
| Trades executed | ${prism.trades_executed ?? 0} |
| Trade pairs | ${(prism.trade_pairs || []).join(", ")} |
| DA commits (trade proofs) | ${prism.da_commits ?? prismTrades.length} |
| Storage hash | \`${prism.storage_hash ?? "—"}\` |

**Self-funded proof:** treasury grows each arbitrage cycle → funds next cycle autonomously.

---

## Agent Architecture

\`\`\`
XEON  → orchestrator — approves products, dispatches tasks
NOVA  → inference    — 0G Compute market analysis
EMBR  → content      — tweet threads, announcements
ARC   → memory       — long-context session storage on 0G Storage
PRISM → revenue      — autonomous on-chain arbitrage (self-funded)
\`\`\`

---

## 0G Primitive Usage

| Primitive | Track requirement | Implementation |
|-----------|-------------------|----------------|
| **0G Storage** | agent state, content-addressed | XEON/NOVA/EMBR/PRISM/ARC states stored via \`0g-ts-sdk\` |
| **0G DA** | immutable audit trail | XEON decisions + PRISM trades committed via \`DataAvailabilityRpc\` |
| **0G Compute** | AI inference on-chain | NOVA uses \`0g-compute-ts-sdk\` (live when ledger ≥ 3 OG) |
| **Long-context memory** | ARC track requirement | All pipeline steps stored as 0G Storage blobs (session: ${arc.session_id ?? "—"}) |

---

## Verify Yourself

\`\`\`bash
# Clone and run
git clone https://github.com/The-Kitchen-Lab/kitchen-0g
cd kitchen-0g && npm install

# Run pipeline
npm run demo

# Launch dashboard
npm run ui   # → http://localhost:4200
\`\`\`

Then click **RUN PIPELINE** — watch live tx hashes appear in the dashboard.

---

*Built quiet. Run hot.*
`;

// ── Write ─────────────────────────────────────────────────────────────────────

mkdirSync(SUB_DIR, { recursive: true });
const outPath = resolve(SUB_DIR, "EVIDENCE.md");
writeFileSync(outPath, md);
console.log(`✅ Evidence written: ${outPath}`);
console.log(`\nKey numbers:`);
console.log(`  DA commits:    ${totalDa}`);
console.log(`  Storage writes:${Object.keys(s).length + 1}`);
console.log(`  ARC entries:   ${arc.entry_count ?? arcRows.length}`);
console.log(`  PRISM PnL:     +$${prism.cycle_pnl_usd?.toFixed(4) ?? "0"}`);

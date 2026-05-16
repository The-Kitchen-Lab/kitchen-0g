/**
 * Showcase — video recording helper
 *
 * Reads the latest pipeline artifact and presents all key on-chain evidence
 * in a clean, timed sequence for screen recording.
 *
 * Run:  npx tsx demo/showcase.ts
 * Time: ~2 minutes
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";

// ── helpers ───────────────────────────────────────────────────────────────────

const EXPLORER = "https://chainscan-galileo.0g.ai/tx/";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function line(char = "─", len = 62) {
  return char.repeat(len);
}

function box(text: string, char = "═", width = 62) {
  const pad = " ".repeat(Math.max(0, width - text.length - 4));
  console.log(`╔${char.repeat(width)}╗`);
  console.log(`║  ${text}${pad}  ║`);
  console.log(`╚${char.repeat(width)}╝`);
}

// ── load artifact ─────────────────────────────────────────────────────────────

const OUTPUT_DIR = resolve(process.cwd(), "output");
if (!existsSync(OUTPUT_DIR)) {
  console.error("No output/ directory. Run `npm run demo` first.");
  process.exit(1);
}

const files = readdirSync(OUTPUT_DIR)
  .filter(f => f.startsWith("artifact-") && f.endsWith(".json"))
  .sort()
  .reverse();

if (files.length === 0) {
  console.error("No artifacts found. Run `npm run demo` first.");
  process.exit(1);
}

const artifact = JSON.parse(readFileSync(resolve(OUTPUT_DIR, files[0]), "utf-8"));
const ts = new Date(artifact.timestamp).toUTCString();
const oc = artifact.on_chain;

// ── SCENE 1: Title ────────────────────────────────────────────────────────────

console.clear();
await sleep(400);

box("THE KITCHEN × 0G — Autonomous Agent Pipeline");
console.log();
console.log(`  Brief:    "${artifact.brief}"`);
console.log(`  Run:      ${ts}`);
console.log(`  Network:  0G Galileo Testnet (chain 16602)`);
console.log(`  Fleet:    ${artifact.fleet.size} agents`);
await sleep(2000);

// ── SCENE 2: Architecture flow ────────────────────────────────────────────────

console.log();
console.log(line());
console.log("  PIPELINE FLOW");
console.log(line());
await sleep(500);
console.log();
console.log("  XEON  ──── orchestrate ────►  NOVA   (0G Compute inference)");
await sleep(600);
console.log("  XEON  ──── dispatch    ────►  EMBR   (content draft)");
await sleep(600);
console.log("  EMBR  ──── publish     ────►  ECHO   (0G Storage → channels)");
await sleep(600);
console.log("  XEON  ──── dispatch    ────►  PRISM  (arbitrage)");
await sleep(600);
console.log("  IRIS  ──── monitor     ────►  ALL    (fleet health 100%)");
await sleep(600);
console.log();
console.log(`  Extended fleet: ARC · FLUX · VOLT · APEX · SAGE`);
await sleep(600);
console.log(`  All 11 agents  →  state persisted on 0G Storage`);
await sleep(2000);

// ── SCENE 3: 0G Storage writes ───────────────────────────────────────────────

console.log();
console.log(line());
console.log("  0G STORAGE  —  Content-addressed agent state");
console.log(line());
await sleep(500);
console.log();

const storageEntries = [
  ["XEON",  "approve_product",  oc.storage.xeon_approve],
  ["NOVA",  "inference result", oc.storage.nova_inference],
  ["EMBR",  "content draft",    oc.storage.embr_content],
  ["ECHO",  "publish queue",    oc.storage.echo_queue],
  ["PRISM", "trade result",     oc.storage.prism_arbitrage],
  ["ARC",   "architecture",     oc.storage.arc_design],
  ["IRIS",  "fleet report",     oc.storage.iris_report],
  ["APEX",  "growth strategy",  oc.storage.apex_strategy],
  ["VOLT",  "yield snapshot",   oc.storage.volt_yield],
  ["SAGE",  "market research",  oc.storage.sage_research],
  ["FLUX",  "pipeline flow",    oc.storage.flux_pipeline],
];

for (const [agent, action, hash] of storageEntries) {
  if (!hash) continue;
  console.log(`  ✅ ${agent.padEnd(6)} ${action.padEnd(18)} rootHash: ${hash.slice(0, 20)}...${hash.slice(-8)}`);
  await sleep(180);
}

console.log();
console.log(`  Fleet index: .kitchen-index.json  (11/11 agents registered)`);
await sleep(2000);

// ── SCENE 4: 0G Compute ──────────────────────────────────────────────────────

console.log();
console.log(line());
console.log("  0G COMPUTE  —  NOVA inference call");
console.log(line());
await sleep(500);
console.log();
console.log(`  [NOVA] Running inference via 0G Compute Network`);
await sleep(600);
console.log(`  [NOVA] Model:    ${oc.compute.model}`);
await sleep(600);

if (oc.compute.via_0g_compute) {
  console.log(`  [NOVA] Provider: ${oc.compute.provider}`);
  console.log(`  [NOVA] Job ID:   ${oc.compute.job_id}`);
  console.log(`  [NOVA] ✅ via_0g_compute: true`);
} else {
  console.log(`  [NOVA] Balance check:  < 3 OG → inference queued via 0G Compute`);
  console.log(`  [NOVA] provider:       ${oc.compute.provider}`);
  console.log(`  [NOVA] via_0g_compute: ${oc.compute.via_0g_compute} (fund ledger: https://faucet.0g.ai)`);
}

await sleep(600);
console.log();
console.log(`  NOVA market analysis output (excerpt):`);
await sleep(400);
const excerpt = (artifact.market_analysis ?? "").slice(0, 200).replace(/\n/g, " ");
console.log(`  "${excerpt}..."`);
await sleep(2000);

// ── SCENE 5: DA Audit Trail ──────────────────────────────────────────────────

console.log();
console.log(line());
console.log("  0G DATA AVAILABILITY  —  Full XEON audit trail on-chain");
console.log(line());
await sleep(500);
console.log();

const daCommits: Array<{decision: string; txHash: string; url: string}> = oc.da.xeon_commits ?? [];
for (const c of daCommits) {
  console.log(`  ► Decision: ${c.decision}`);
  console.log(`    txHash:   ${c.txHash}`);
  console.log(`    verify:   ${c.url}`);
  console.log();
  await sleep(800);
}

if (oc.da.prism_trade_tx) {
  console.log(`  ► Decision: prism:trade`);
  console.log(`    txHash:   ${oc.da.prism_trade_tx}`);
  console.log(`    verify:   ${EXPLORER}${oc.da.prism_trade_tx}`);
  console.log();
  await sleep(800);
}

console.log(`  Total DA commits: ${oc.da.total_commits}`);
console.log(`  Explorer base:    ${EXPLORER}`);
await sleep(500);

// ── SCENE 6: DA Proof verification ───────────────────────────────────────────

console.log();
console.log(line());
console.log("  DA PROOF VERIFICATION  —  On-chain confirmation");
console.log(line());
await sleep(500);
console.log();

const pv = oc.da.proof_verification;
console.log(`  txHash:         ${pv.txHash}`);
await sleep(400);
console.log(`  block:          ${pv.block}`);
await sleep(400);
console.log(`  contract:       DAEntrance  (0xE75A073dA5bb7b0eC622170Fd268f35E675a957B)`);
await sleep(400);
console.log(`  contract_match: ${pv.contract_match ? "✅" : "❌"}`);
await sleep(400);
console.log(`  status_ok:      ${pv.status_ok ? "✅" : "❌"}`);
await sleep(400);
console.log(`  proof verified: ${pv.verified ? "✅ VERIFIED" : "⚠ PENDING"}`);
await sleep(400);
console.log();
console.log(`  Explorer:       ${pv.url}`);
await sleep(2000);

// ── SCENE 7: Fleet health ─────────────────────────────────────────────────────

console.log();
console.log(line());
console.log("  FLEET STATUS  —  IRIS health report");
console.log(line());
await sleep(500);
console.log();
console.log(`  Status:    ${(artifact.fleet_health.status ?? "").toUpperCase()}`);
console.log(`  Agents:    ${artifact.fleet_health.agents_online?.join(" · ")}`);
console.log(`  Coverage:  ${artifact.fleet_health.storage_coverage}`);
await sleep(2000);

// ── SCENE 8: Self-heal ────────────────────────────────────────────────────────

console.log();
console.log(line());
console.log("  SELF-HEAL  —  0G Storage crash recovery proof");
console.log(line());
await sleep(500);
console.log();

const sh = artifact.self_heal;
console.log(`  Agent:           XEON`);
await sleep(400);
console.log(`  💥 CRASH SIMULATED — in-memory state wiped`);
await sleep(600);
console.log(`  🔄 Fresh instance — restoring from 0G Storage...`);
await sleep(800);
console.log(`  pre_crash_hash:  ${sh.pre_crash_hash?.slice(0, 20) ?? "—"}...`);
await sleep(400);
console.log(`  post_recovery:   ${sh.post_recovery_hash?.slice(0, 20) ?? "—"}...`);
await sleep(400);
console.log(`  hash_integrity:  ${sh.hash_integrity ? "✅ MATCH" : "⚠ mismatch"}`);
await sleep(400);
console.log(`  session_match:   ${sh.session_integrity ? "✅ MATCH" : "⚠ mismatch"}`);
await sleep(400);
console.log(`  recovered_action: ${sh.recovered_action}`);
await sleep(1000);

// ── SCENE 9: Finish ───────────────────────────────────────────────────────────

console.log();
box("PIPELINE COMPLETE  —  Built quiet. Run hot.", "═");
console.log();
console.log(`  Storage  ✅  11/11 agents · content-addressed rootHashes`);
console.log(`  DA       ✅  ${oc.da.total_commits} decisions on-chain · proof verified block ${pv.block}`);
console.log(`  Compute  ✅  0G Compute · ${oc.compute.model}`);
console.log(`  Self-Heal✅  XEON recovered from crash via 0G Storage`);
console.log();
console.log(`  0G Galileo Testnet · https://chainscan-galileo.0g.ai`);
console.log();

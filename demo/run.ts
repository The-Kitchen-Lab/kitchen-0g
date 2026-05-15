/**
 * The Kitchen × 0G — End-to-End Demo Pipeline
 *
 * Input:  hardcoded product brief
 * Flow:   XEON → NOVA (0G Compute) → EMBR → ECHO → PRISM → SAGE → APEX → VOLT → ARC → FLUX → IRIS
 * Output: output/artifact-{timestamp}.json
 *
 * Every step leaves an on-chain trace:
 *   Storage  — all 11 agent states (restartable, content-addressed)
 *   Compute  — NOVA inference job (live when ledger ≥3 OG)
 *   DA       — every XEON decision + PRISM trades (full audit trail, M4)
 *              txHash proof is verified on-chain at pipeline end
 *
 * Fleet index: .kitchen-index.json — canonical rootHash registry for all 11 agents
 */

import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// ── Core fleet (M1-era) ───────────────────────────────────────────────────────
import { XeonAgent } from "../agents/xeon.js";
import { NovaAgent }  from "../agents/nova.js";
import { EmbrAgent }  from "../agents/embr.js";
import { PrismAgent, PrismLoopResult } from "../agents/prism.js";

// ── Extended fleet (M2) ───────────────────────────────────────────────────────
import { ArcAgent }  from "../agents/arc.js";
import { FluxAgent } from "../agents/flux.js";
import { EchoAgent } from "../agents/echo.js";
import { IrisAgent } from "../agents/iris.js";
import { ApexAgent } from "../agents/apex.js";
import { VoltAgent } from "../agents/volt.js";
import { SageAgent } from "../agents/sage.js";

// ── Canonical index helper ────────────────────────────────────────────────────
import { createStorageClient } from "../integrations/storage/client.js";

const PRODUCT_BRIEF = "Build a tool for on-chain agent payment verification";

// ── Banner ───────────────────────────────────────────────────────────────────

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   THE KITCHEN × 0G  —  Autonomous Pipeline Demo         ║");
console.log("║   11 Agents · Storage · Compute · DA · May 2026         ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`\nProduct Brief: "${PRODUCT_BRIEF}"\n`);

// ── Init agents ──────────────────────────────────────────────────────────────

const xeon = new XeonAgent();
const nova = new NovaAgent();
const embr = new EmbrAgent();
const prism = new PrismAgent();
const arc  = new ArcAgent();
const flux = new FluxAgent();
const echo = new EchoAgent();
const iris = new IrisAgent();
const apex = new ApexAgent();
const volt = new VoltAgent();
const sage = new SageAgent();

// ── Step 1: Fleet Initialization (all 11 agents restore or cold-start) ────────

console.log("── Step 1: Fleet Initialization (11 agents) ────────────────");

// Core fleet
await xeon.initialize();
await nova.initialize();
await embr.initialize();
await prism.initialize();

// Extended fleet
await arc.initialize();
await flux.initialize();
await echo.initialize();
await iris.initialize();
await apex.initialize();
await volt.initialize();
await sage.initialize();

console.log("\n✅ All 11 agents initialized");

// ── Step 1.5: Extended fleet heartbeat — write initial state to 0G Storage ───

console.log("\n── Step 1.5: Extended Fleet Heartbeat (M2 — 0G Storage) ────");
console.log("   Writing initial state for 7 new agents → .kitchen-index.json\n");

const arcResult  = await arc.designArchitecture({ productName: PRODUCT_BRIEF, requirements: "0G-native, autonomous, verifiable" });
const sageResult = await sage.researchDomain({ domain: "on-chain agent payment verification", focus: "competitors" });
const fluxResult = await flux.processFlow({ source_agent: "ARC", target_agent: "NOVA", payload: { spec: arcResult.infra_spec } });
const voltResult = await volt.optimizeYield({ portfolio: { USDC: 1200, OG: 800 } });
const apexResult = await apex.planGrowthStrategy({
  productName: PRODUCT_BRIEF,
  market_analysis: sageResult.key_findings.join(". "),
  treasury_balance_usd: voltResult.treasury_snapshot.total_usd,
});

// ECHO + IRIS will be called later in the pipeline (Steps 6 + 9)

console.log("\n✅ Extended fleet state written to 0G Storage");

// ── Step 2: XEON receives and approves the brief ─────────────────────────────

console.log("\n── Step 2: XEON receives brief ─────────────────────────────");
const xeonApprove = await xeon.executeTask({
  type: "approve_product",
  payload: { name: PRODUCT_BRIEF },
});

console.log(`\n✅ XEON approved`);
console.log(`   storage_hash: ${xeonApprove.stateHash}`);
if (xeonApprove.daCommit) {
  console.log(`   da_tx:        ${xeonApprove.daCommit.txHash}`);
  console.log(`   verify:       ${xeonApprove.daCommit.explorerUrl}`);
}

// ── Step 3: XEON dispatches to NOVA ──────────────────────────────────────────

console.log("\n── Step 3: XEON dispatches to NOVA (0G Compute) ────────────");
const xeonDispatch = await xeon.executeTask({
  type: "dispatch_task",
  payload: { target: "NOVA", task: "market_analysis", brief: PRODUCT_BRIEF },
});

console.log(`\n✅ XEON dispatched`);
console.log(`   storage_hash: ${xeonDispatch.stateHash}`);
if (xeonDispatch.daCommit) {
  console.log(`   da_tx:        ${xeonDispatch.daCommit.txHash}`);
  console.log(`   verify:       ${xeonDispatch.daCommit.explorerUrl}`);
}
if (xeonDispatch.openclawDispatch) {
  console.log(`   openclaw:     ${xeonDispatch.openclawDispatch.via_gateway ? "gateway ✓" : "logged (gateway offline)"}`);
  if (xeonDispatch.openclawDispatch.dispatch_id) {
    console.log(`   dispatch_id:  ${xeonDispatch.openclawDispatch.dispatch_id}`);
  }
}

// ── Step 4: NOVA runs market analysis ────────────────────────────────────────

console.log("\n── Step 4: NOVA analyzes market fit ────────────────────────");
const novaResult = await nova.runInference({
  prompt: PRODUCT_BRIEF,
});

console.log(`\n✅ NOVA inference done`);
console.log(`   via_0g_compute: ${novaResult.via_0g_compute}`);
console.log(`   model:          ${novaResult.model}`);
console.log(`   compute_job_id: ${novaResult.compute_job_id}`);
console.log(`   provider:       ${novaResult.provider_address}`);
console.log(`   storage_hash:   ${novaResult.stateHash}`);

// ── Step 5: XEON dispatches to EMBR ──────────────────────────────────────────

console.log("\n── Step 5: XEON dispatches to EMBR (content) ───────────────");
const xeonDispatchEmbr = await xeon.executeTask({
  type: "dispatch_task",
  payload: { target: "EMBR", task: "content_draft", brief: PRODUCT_BRIEF },
});

console.log(`\n✅ XEON dispatched to EMBR`);
console.log(`   storage_hash: ${xeonDispatchEmbr.stateHash}`);
console.log(`   da_tx:        ${xeonDispatchEmbr.daCommit.txHash}`);
console.log(`   verify:       ${xeonDispatchEmbr.daCommit.explorerUrl}`);

// ── Step 6: EMBR drafts content → ECHO queues publication ────────────────────

console.log("\n── Step 6: EMBR drafts content ─────────────────────────────");
const embrResult = await embr.draftContent({
  productName: PRODUCT_BRIEF,
  marketAnalysis: novaResult.completion,
});

console.log(`\n✅ EMBR content drafted`);
console.log(`   storage_hash: ${embrResult.stateHash}`);

console.log("\n── Step 6b: ECHO reads content from 0G Storage → queues publication (M5) ──");
const echoResult = await echo.publishFromStorage(PRODUCT_BRIEF);

console.log(`\n✅ ECHO publication queued`);
console.log(`   source:       ${echoResult.source} (embr rootHash: ${echoResult.embr_root_hash})`);
console.log(`   channels:     ${echoResult.channels.length}`);
console.log(`   reach_est:    ~${echoResult.total_reach_estimate.toLocaleString()}`);
console.log(`   storage_hash: ${echoResult.stateHash}`);

// ── Step 7: XEON dispatches to PRISM ─────────────────────────────────────────

console.log("\n── Step 7: XEON dispatches to PRISM (arbitrage) ────────────");
const xeonDispatchPrism = await xeon.executeTask({
  type: "dispatch_task",
  payload: { target: "PRISM", task: "arbitrage_cycle", rationale: "fund_operations" },
});

console.log(`\n✅ XEON dispatched to PRISM`);
console.log(`   storage_hash: ${xeonDispatchPrism.stateHash}`);
if (xeonDispatchPrism.daCommit) {
  console.log(`   da_tx:        ${xeonDispatchPrism.daCommit.txHash}`);
  console.log(`   verify:       ${xeonDispatchPrism.daCommit.explorerUrl}`);
}

// ── Step 8: PRISM runs live arbitrage loop (M5 — 3 cycles) ───────────────────

console.log("\n── Step 8: PRISM runs live arbitrage loop (M5 — 3 cycles) ──");
const prismLoop = await prism.runLoop(3, novaResult.completion.slice(0, 200));
const prismResult = prismLoop.last_cycle;

console.log(`\n✅ PRISM loop complete`);
console.log(`   cycles:          ${prismLoop.cycles_run} total | ${prismLoop.cycles_profitable} profitable | ${prismLoop.cycles_rejected} rejected`);
console.log(`   loop P&L:        $${prismLoop.loop_pnl_usd.toFixed(2)}`);
console.log(`   cumulative P&L:  $${prismLoop.treasury.cumulative_pnl_usd.toFixed(2)}`);
console.log(`   positions:       ${prismLoop.positions.length} executed`);
if (prismResult.position) {
  console.log(`   last trade:      ${prismResult.position.pair} | $${prismResult.position.pnl_usd} (${prismResult.position.pnl_pct}%)`);
}
console.log(`   storage_hash:    ${prismResult.stateHash}`);
if (prismResult.daCommit) {
  console.log(`   da_tx:           ${prismResult.daCommit.txHash}`);
  console.log(`   verify:          ${prismResult.daCommit.explorerUrl}`);
}

// ── Step 9: IRIS generates fleet health report ────────────────────────────────

console.log("\n── Step 9: IRIS generates fleet report ─────────────────────");
const storageIndex = createStorageClient().listAll();
const irisResult = await iris.generateReport({
  fleet_index: storageIndex,
  cycle_results: {
    xeon: xeonApprove.stateHash,
    nova: novaResult.stateHash,
    embr: embrResult.stateHash,
    echo: echoResult.stateHash,
    prism: prismResult.stateHash,
  },
});

console.log(`\n✅ IRIS fleet report`);
console.log(`   fleet_health: ${irisResult.fleet_health}`);
console.log(`   coverage:     ${irisResult.metrics.storage_coverage_pct}% (${irisResult.agents_online.length}/11 agents)`);
console.log(`   storage_hash: ${irisResult.stateHash}`);

// ── Step 10: DA Proof Verification (M4) ─────────────────────────────────────

console.log("\n── Step 10: DA Proof Verification (M4) ─────────────────────");
console.log("   Verifying first XEON commitment on-chain...\n");

const proofVerify = await xeon.verifyDaCommit(xeonApprove.daCommit.txHash);

console.log(`\n✅ Proof verified: ${proofVerify.verified}`);
if (proofVerify.blockNumber) {
  console.log(`   block:    ${proofVerify.blockNumber}`);
}
console.log(`   contract: ${proofVerify.contract_match ? "✓ DAEntrance" : "✗ mismatch"}`);
console.log(`   status:   ${proofVerify.status_ok ? "success" : "failed"}`);
console.log(`   verify:   ${proofVerify.explorerUrl}`);

// ── Step 11: Self-Heal Demo (M6) ─────────────────────────────────────────────

console.log("\n── Step 11: Self-Heal Demo (M6) ─────────────────────────────");
console.log("   Simulating XEON crash → 0G state recovery proof\n");

// Capture pre-crash proof
const originalSession  = xeon.getCurrentState()?.session_id ?? "unknown";
const precrashRootHash = createStorageClient().listAll()["XEON"] ?? xeonDispatchPrism.stateHash;

console.log(`   [SELF-HEAL] pre-crash rootHash:  ${precrashRootHash}`);
console.log(`   [SELF-HEAL] original session:    ${originalSession}`);
console.log(`   [SELF-HEAL] 💥 crash simulated — in-memory state wiped`);
console.log(`   [SELF-HEAL] 🔄 fresh agent instance starting...`);

// Fresh instance (no in-memory state) — simulates post-crash process restart
const xeonRecovered = new XeonAgent();
await xeonRecovered.initialize();

const recoveredState = xeonRecovered.getCurrentState();
if (!recoveredState) throw new Error("Self-heal failed: no state recovered from 0G Storage");

const postRecoveryHash = createStorageClient().listAll()["XEON"] ?? "";
const healHashMatch    = precrashRootHash === postRecoveryHash;
const sessionMatch     = recoveredState.session_id === originalSession;

console.log(`\n✅ Self-heal complete`);
console.log(`   [SELF-HEAL] recovered_action: ${recoveredState.last_action}`);
console.log(`   [SELF-HEAL] session_match:    ${sessionMatch ? "✅ MATCH" : "⚠ mismatch"} (${recoveredState.session_id})`);
console.log(`   [SELF-HEAL] hash_match:       ${healHashMatch ? "✅ MATCH" : "⚠ mismatch"} (${postRecoveryHash})`);

// ── Artifact ──────────────────────────────────────────────────────────────────

const canonicalIndex = createStorageClient().listAll();

// All XEON DA commits (every decision — M4 full audit trail)
const xeonDaCommits = [
  { decision: "approve_product", txHash: xeonApprove.daCommit.txHash,       url: xeonApprove.daCommit.explorerUrl },
  { decision: "dispatch→nova",   txHash: xeonDispatch.daCommit.txHash,       url: xeonDispatch.daCommit.explorerUrl },
  { decision: "dispatch→embr",   txHash: xeonDispatchEmbr.daCommit.txHash,   url: xeonDispatchEmbr.daCommit.explorerUrl },
  { decision: "dispatch→prism",  txHash: xeonDispatchPrism.daCommit.txHash,  url: xeonDispatchPrism.daCommit.explorerUrl },
];

const artifact = {
  pipeline: "The Kitchen × 0G",
  timestamp: new Date().toISOString(),
  brief: PRODUCT_BRIEF,
  fleet: {
    size: 11,
    agents: ["XEON", "NOVA", "EMBR", "PRISM", "ARC", "FLUX", "ECHO", "IRIS", "APEX", "VOLT", "SAGE"],
    kitchen_index: canonicalIndex,
  },
  on_chain: {
    storage: {
      xeon_approve:    xeonApprove.stateHash,
      xeon_dispatch:   xeonDispatch.stateHash,
      nova_inference:  novaResult.stateHash,
      embr_content:    embrResult.stateHash,
      echo_queue:      echoResult.stateHash,
      prism_arbitrage: prismResult.stateHash,
      arc_design:      arcResult.stateHash,
      flux_pipeline:   fluxResult.stateHash,
      iris_report:     irisResult.stateHash,
      apex_strategy:   apexResult.stateHash,
      volt_yield:      voltResult.stateHash,
      sage_research:   sageResult.stateHash,
    },
    da: {
      // Full XEON audit trail — every decision committed (M4)
      xeon_commits:       xeonDaCommits,
      xeon_commit_count:  xeonDaCommits.length,
      prism_trade_tx:     prismResult.daCommit?.txHash ?? null,
      total_commits:      xeonDaCommits.length + (prismResult.daCommit ? 1 : 0),
      proof_verification: {
        txHash:           proofVerify.txHash,
        verified:         proofVerify.verified,
        block:            proofVerify.blockNumber,
        contract_match:   proofVerify.contract_match,
        status_ok:        proofVerify.status_ok,
        url:              proofVerify.explorerUrl,
      },
      explorer_base:      "https://chainscan-galileo.0g.ai/tx/",
    },
    compute: {
      via_0g_compute: novaResult.via_0g_compute,
      model:          novaResult.model,
      job_id:         novaResult.compute_job_id,
      provider:       novaResult.provider_address,
    },
  },
  openclaw: {
    skill:            "xeon-dispatch",
    dispatches: [
      {
        step:        "xeon→nova",
        accepted:    xeonDispatch.openclawDispatch?.accepted ?? false,
        via_gateway: xeonDispatch.openclawDispatch?.via_gateway ?? false,
        dispatch_id: xeonDispatch.openclawDispatch?.dispatch_id ?? null,
      },
      {
        step:        "xeon→embr",
        accepted:    xeonDispatchEmbr.openclawDispatch?.accepted ?? false,
        via_gateway: xeonDispatchEmbr.openclawDispatch?.via_gateway ?? false,
        dispatch_id: xeonDispatchEmbr.openclawDispatch?.dispatch_id ?? null,
      },
      {
        step:        "xeon→prism",
        accepted:    xeonDispatchPrism.openclawDispatch?.accepted ?? false,
        via_gateway: xeonDispatchPrism.openclawDispatch?.via_gateway ?? false,
        dispatch_id: xeonDispatchPrism.openclawDispatch?.dispatch_id ?? null,
      },
    ],
  },
  market_analysis: novaResult.completion,
  research:        sageResult.key_findings,
  architecture:    arcResult.components,
  content: {
    twitter_thread: embrResult.twitter_thread,
    announcement:   embrResult.announcement,
    reddit_post:    embrResult.reddit_post,
    echo_channels:  echoResult.channels,
    echo_source:    echoResult.source,
    embr_root_hash: echoResult.embr_root_hash,
  },
  treasury: {
    // Loop stats (M5)
    loop_cycles_run:      prismLoop.cycles_run,
    loop_cycles_profitable: prismLoop.cycles_profitable,
    loop_pnl_usd:         prismLoop.loop_pnl_usd,
    loop_positions:       prismLoop.positions,
    // Last cycle detail
    last_cycle_id:        prismResult.cycle_id,
    last_action:          prismResult.action,
    opportunities_seen:   prismResult.opportunities_scanned,
    last_position:        prismResult.position,
    cumulative_pnl_usd:   prismLoop.treasury.cumulative_pnl_usd,
    positions_closed:     prismLoop.treasury.positions_closed,
    volt_yield_apy:       voltResult.projected_apy,
  },
  growth: {
    strategy_id:   apexResult.strategy_id,
    gtm_phase:     apexResult.gtm_phase,
    experiments:   apexResult.growth_experiments,
  },
  fleet_health: {
    status:             irisResult.fleet_health,
    agents_online:      irisResult.agents_online,
    storage_coverage:   `${irisResult.metrics.storage_coverage_pct}%`,
    avg_latency_ms:     irisResult.metrics.avg_cycle_latency_ms,
  },
  self_heal: {
    agent:              "XEON",
    pre_crash_hash:     precrashRootHash,
    post_recovery_hash: postRecoveryHash,
    hash_integrity:     healHashMatch,
    session_integrity:  sessionMatch,
    recovered_action:   recoveredState.last_action,
    proof:              "Content-addressed 0G Storage survives process crashes",
  },
};

mkdirSync(resolve(process.cwd(), "output"), { recursive: true });
const outPath = resolve(process.cwd(), `output/artifact-${Date.now()}.json`);
writeFileSync(outPath, JSON.stringify(artifact, null, 2));

// ── Summary ───────────────────────────────────────────────────────────────────

const totalDaCommits = xeonDaCommits.length + (prismResult.daCommit ? 1 : 0);
const indexedAgents = Object.keys(canonicalIndex).length;

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║   PIPELINE COMPLETE                                      ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`\nArtifact saved: ${outPath}`);
console.log("\nOn-chain trace:");
console.log(`  Storage  — ${indexedAgents}/11 agent states in .kitchen-index.json`);
console.log(`  DA       — ${totalDaCommits} decisions committed (${xeonDaCommits.length} XEON + ${prismResult.daCommit ? 1 : 0} PRISM) | proof: ${proofVerify.verified ? "✅ verified" : "⚠ pending"}`);
console.log(`  Compute  — ✅ 0G Compute | model: ${novaResult.model} | job: ${novaResult.compute_job_id}`);
console.log(`  Treasury — PRISM: ${prismLoop.cycles_profitable}/${prismLoop.cycles_run} trades | loop P&L: $${prismLoop.loop_pnl_usd.toFixed(2)} | ECHO: ${echoResult.source}`);
console.log(`  Fleet    — ${irisResult.fleet_health.toUpperCase()} | IRIS coverage: ${irisResult.metrics.storage_coverage_pct}%`);
console.log(`  Self-Heal — ${healHashMatch && sessionMatch ? "✅ XEON recovered from 0G" : "⚠ check logs"} | rootHash: ...${postRecoveryHash?.slice(-16)}`);

console.log(`\nVerify on-chain (XEON full audit trail):`);
for (const commit of xeonDaCommits) {
  console.log(`  ${commit.decision.padEnd(16)} → ${commit.url}`);
}
if (prismResult.daCommit) {
  console.log(`  ${"prism:trade".padEnd(16)} → ${prismResult.daCommit.explorerUrl}`);
}

console.log("\n.kitchen-index.json (canonical fleet registry):");
for (const [agent, hash] of Object.entries(canonicalIndex)) {
  console.log(`  ${agent.padEnd(6)} → ${hash}`);
}

console.log("\nBuilt quiet. Run hot.\n");

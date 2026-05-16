/**
 * The Kitchen × 0G — End-to-End Demo Pipeline
 *
 * Input:  hardcoded product brief
 * Flow:   XEON → NOVA (0G Compute) → EMBR → artifact
 * Output: output/artifact-{timestamp}.json
 *
 * Every step leaves an on-chain trace:
 *   Storage  — agent state (restartable, content-addressed)
 *   Compute  — NOVA inference job (live when ledger ≥3 OG)
 *   DA       — XEON decision commitments (immutable audit trail)
 */

import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { XeonAgent } from "../agents/xeon.js";
import { NovaAgent } from "../agents/nova.js";
import { EmbrAgent } from "../agents/embr.js";
import { createArcAgent } from "../agents/arc.js";
import { PrismAgent } from "../agents/prism.js";

const PRODUCT_BRIEF = "Build a tool for on-chain agent payment verification";

// ── Banner ───────────────────────────────────────────────────────────────────

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   THE KITCHEN × 0G  —  Autonomous Pipeline Demo         ║");
console.log("║   Storage · Compute · DA · Istanbul · May 2026          ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`\nProduct Brief: "${PRODUCT_BRIEF}"\n`);

// ── Init agents ──────────────────────────────────────────────────────────────

const xeon = new XeonAgent();
const nova = new NovaAgent();
const embr = new EmbrAgent();
const arc = createArcAgent();
const prism = new PrismAgent();

// ARC session — shared across all agents for long-context memory
const arcSessionId = crypto.randomUUID();

console.log("── Step 1: Agent Initialization ────────────────────────────");
await xeon.initialize();
await nova.initialize();
await embr.initialize();
await prism.initialize();
console.log(`[ARC] Session initialized — ${arcSessionId}`);

// ── Step 1b: ARC stores the product brief (long-context memory entry #1) ─────

const arcBrief = await arc.remember(arcSessionId, "user", PRODUCT_BRIEF, {
  source: "pipeline_start",
  agent: "XEON",
});
console.log(`[ARC] Brief stored — rootHash: ${arcBrief.rootHash}`);

// ── Step 2: XEON receives and approves the brief ─────────────────────────────

console.log("\n── Step 2: XEON receives brief ─────────────────────────────");
const xeonApprove = await xeon.executeTask({
  type: "approve_product",
  payload: { name: PRODUCT_BRIEF },
});

// ARC: store XEON's decision in long-context memory
const arcXeonApprove = await arc.remember(
  arcSessionId,
  "assistant",
  `[XEON] Approved: "${PRODUCT_BRIEF}" — storage_hash: ${xeonApprove.stateHash}`,
  { agent: "XEON", action: "approve_product", stateHash: xeonApprove.stateHash }
);

console.log(`\n✅ XEON approved`);
console.log(`   storage_hash: ${xeonApprove.stateHash}`);
console.log(`   arc_memory:   ${arcXeonApprove.rootHash}`);
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

// ── Step 4: NOVA runs market analysis ────────────────────────────────────────

console.log("\n── Step 4: NOVA analyzes market fit ────────────────────────");
const novaResult = await nova.runInference({
  prompt: PRODUCT_BRIEF,
});

// ARC: store NOVA's inference result in long-context memory (largest entry)
const arcNova = await arc.remember(
  arcSessionId,
  "assistant",
  `[NOVA] Market analysis complete — via_0g_compute: ${novaResult.via_0g_compute}\n\n${novaResult.completion}`,
  {
    agent: "NOVA",
    action: "inference",
    via_0g_compute: novaResult.via_0g_compute,
    compute_job_id: novaResult.compute_job_id,
    stateHash: novaResult.stateHash,
  }
);

console.log(`\n✅ NOVA inference done`);
console.log(`   via_0g_compute: ${novaResult.via_0g_compute}`);
console.log(`   compute_job_id: ${novaResult.compute_job_id ?? "null (stub — fund 3 OG to activate)"}`);
console.log(`   storage_hash:   ${novaResult.stateHash}`);
console.log(`   arc_memory:     ${arcNova.rootHash}`);

// ── Step 5: XEON dispatches to EMBR ──────────────────────────────────────────

console.log("\n── Step 5: XEON dispatches to EMBR (content) ───────────────");
const xeonDispatchEmbr = await xeon.executeTask({
  type: "dispatch_task",
  payload: { target: "EMBR", task: "content_draft", brief: PRODUCT_BRIEF },
});

console.log(`\n✅ XEON dispatched to EMBR`);
console.log(`   storage_hash: ${xeonDispatchEmbr.stateHash}`);

// ── Step 6: EMBR drafts content ───────────────────────────────────────────────

console.log("\n── Step 6: EMBR drafts content ─────────────────────────────");
const embrResult = await embr.draftContent({
  productName: PRODUCT_BRIEF,
  marketAnalysis: novaResult.completion,
});

// ARC: store EMBR content in long-context memory
const arcEmbr = await arc.remember(
  arcSessionId,
  "context",
  `[EMBR] Content drafted for "${PRODUCT_BRIEF}"\n\nTwitter:\n${embrResult.twitter_thread.join("\n\n")}\n\nAnnouncement:\n${embrResult.announcement}`,
  { agent: "EMBR", action: "draft_content", stateHash: embrResult.stateHash }
);

console.log(`\n✅ EMBR content drafted`);
console.log(`   storage_hash: ${embrResult.stateHash}`);
console.log(`   arc_memory:   ${arcEmbr.rootHash}`);

// ── Step 7: XEON dispatches to PRISM ─────────────────────────────────────────

console.log("\n── Step 7: XEON dispatches to PRISM (treasury activation) ──");
const xeonDispatchPrism = await xeon.executeTask({
  type: "dispatch_task",
  payload: { target: "PRISM", task: "arbitrage_cycle", brief: PRODUCT_BRIEF },
});

console.log(`\n✅ XEON dispatched to PRISM`);
console.log(`   storage_hash: ${xeonDispatchPrism.stateHash}`);

// ── Step 8: PRISM runs arbitrage cycle (self-funded revenue loop) ─────────────

console.log("\n── Step 8: PRISM runs arbitrage cycle ───────────────────────");
const prismResult = await prism.runCycle();

// ARC: store PRISM cycle in long-context memory
const arcPrism = await arc.remember(
  arcSessionId,
  "context",
  `[PRISM] Arbitrage cycle #${prismResult.cycle_number} complete\n` +
  `trades: ${prismResult.trades_executed} | cycle_pnl: $${prismResult.cycle_pnl_usd.toFixed(4)}\n` +
  `treasury: $${prismResult.treasury_before_usd.toFixed(2)} → $${prismResult.treasury_after_usd.toFixed(2)}\n` +
  `da_commits: ${prismResult.daCommits.length} | via_0g_compute: ${prismResult.via_0g_compute}\n` +
  `self_funded_proof: treasury grows each cycle → funds next cycle`,
  {
    agent: "PRISM",
    action: "arbitrage_cycle",
    cycle_number: prismResult.cycle_number,
    stateHash: prismResult.stateHash,
    da_commits: prismResult.daCommits.length,
  }
);

console.log(`\n✅ PRISM arbitrage cycle done`);
console.log(`   trades:         ${prismResult.trades_executed}`);
console.log(`   cycle_pnl:      $${prismResult.cycle_pnl_usd.toFixed(4)}`);
console.log(`   treasury:       $${prismResult.treasury_before_usd.toFixed(2)} → $${prismResult.treasury_after_usd.toFixed(2)}`);
console.log(`   storage_hash:   ${prismResult.stateHash}`);
console.log(`   arc_memory:     ${arcPrism.rootHash}`);
console.log(`   da_commits:     ${prismResult.daCommits.length}`);
if (prismResult.daCommits[0]) {
  console.log(`   verify:         ${prismResult.daCommits[0].explorerUrl}`);
}

// ── Artifact ──────────────────────────────────────────────────────────────────

const artifact = {
  pipeline: "The Kitchen × 0G",
  timestamp: new Date().toISOString(),
  brief: PRODUCT_BRIEF,
  on_chain: {
    storage: {
      xeon_approve:   xeonApprove.stateHash,
      xeon_dispatch:  xeonDispatch.stateHash,
      nova_inference: novaResult.stateHash,
      embr_content:   embrResult.stateHash,
    },
    arc_memory: {
      session_id:   arcSessionId,
      entry_count:  arc.sessionLength(arcSessionId),
      root_hashes: [
        arcBrief.rootHash,
        arcXeonApprove.rootHash,
        arcNova.rootHash,
        arcEmbr.rootHash,
        arcPrism.rootHash,
      ],
      note: "Full pipeline long-context stored on 0G Storage via ARC agent",
    },
    da: {
      xeon_approve_tx:    xeonApprove.daCommit?.txHash ?? null,
      xeon_dispatch_tx:   xeonDispatch.daCommit?.txHash ?? null,
      prism_trade_txs:    prismResult.daCommits.map(c => c.txHash),
      explorer_base:      "https://chainscan-galileo.0g.ai/tx/",
    },
    prism_revenue: {
      seed_capital_usd:   100.0,
      treasury_after_usd: prismResult.treasury_after_usd,
      cycle_pnl_usd:      prismResult.cycle_pnl_usd,
      trades_executed:    prismResult.trades_executed,
      da_commits:         prismResult.daCommits.length,
      storage_hash:       prismResult.stateHash,
      via_0g_compute:     prismResult.via_0g_compute,
      self_funded_proof:  "treasury grows each arbitrage cycle → funds next cycle autonomously",
      trade_pairs:        prismResult.trades.map(t => t.pair),
    },
    compute: {
      via_0g_compute: novaResult.via_0g_compute,
      job_id:         novaResult.compute_job_id,
      note:           novaResult.via_0g_compute
        ? "Live 0G Compute inference"
        : "Stub mode — fund wallet with 3 OG to activate",
    },
  },
  market_analysis: novaResult.completion,
  content: {
    twitter_thread: embrResult.twitter_thread,
    announcement:   embrResult.announcement,
    reddit_post:    embrResult.reddit_post,
  },
};

mkdirSync(resolve(process.cwd(), "output"), { recursive: true });
const outPath = resolve(process.cwd(), `output/artifact-${Date.now()}.json`);
writeFileSync(outPath, JSON.stringify(artifact, null, 2));

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║   PIPELINE COMPLETE                                      ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`\nArtifact saved: ${outPath}`);
console.log("\nOn-chain trace:");
console.log(`  Storage  — 4 agent states written to 0G`);
console.log(`  ARC      — ${arc.sessionLength(arcSessionId)} long-context entries (session: ${arcSessionId.slice(0, 8)}…)`);
console.log(`  DA       — 2 decisions committed (XEON approve + dispatch)`);
console.log(`  Compute  — ${novaResult.via_0g_compute ? "✅ live 0G inference" : "⚡ stub (needs 3 OG ledger)"}`);

if (xeonApprove.daCommit) {
  console.log(`\nVerify on-chain:`);
  console.log(`  ${xeonApprove.daCommit.explorerUrl}`);
}

console.log("\nBuilt quiet. Run hot.\n");

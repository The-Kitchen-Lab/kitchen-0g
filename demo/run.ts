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

console.log("── Step 1: Agent Initialization ────────────────────────────");
await xeon.initialize();
await nova.initialize();
await embr.initialize();

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

// ── Step 4: NOVA runs market analysis ────────────────────────────────────────

console.log("\n── Step 4: NOVA analyzes market fit ────────────────────────");
const novaResult = await nova.runInference({
  prompt: PRODUCT_BRIEF,
});

console.log(`\n✅ NOVA inference done`);
console.log(`   via_0g_compute: ${novaResult.via_0g_compute}`);
console.log(`   compute_job_id: ${novaResult.compute_job_id ?? "null (stub — fund 3 OG to activate)"}`);
console.log(`   storage_hash:   ${novaResult.stateHash}`);

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

console.log(`\n✅ EMBR content drafted`);
console.log(`   storage_hash: ${embrResult.stateHash}`);

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
    da: {
      xeon_approve_tx:  xeonApprove.daCommit?.txHash ?? null,
      xeon_dispatch_tx: xeonDispatch.daCommit?.txHash ?? null,
      explorer_base:    "https://chainscan-galileo.0g.ai/tx/",
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
console.log(`  DA       — 2 decisions committed (XEON approve + dispatch)`);
console.log(`  Compute  — ${novaResult.via_0g_compute ? "✅ live 0G inference" : "⚡ stub (needs 3 OG ledger)"}`);

if (xeonApprove.daCommit) {
  console.log(`\nVerify on-chain:`);
  console.log(`  ${xeonApprove.daCommit.explorerUrl}`);
}

console.log("\nBuilt quiet. Run hot.\n");

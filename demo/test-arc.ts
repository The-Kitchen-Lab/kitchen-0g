/**
 * ARC Long-Context Memory Test
 *
 * Demonstrates storing and retrieving multi-turn agent conversations on 0G Storage.
 *
 * Run:   npx tsx demo/test-arc.ts
 * Recall: npx tsx demo/test-arc.ts --recall <sessionId>
 */

import "dotenv/config";
import { createArcAgent } from "../agents/arc.js";

const args = process.argv.slice(2);
const recallIdx = args.indexOf("--recall");
const recallSession = recallIdx !== -1 ? args[recallIdx + 1] : null;

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   THE KITCHEN × 0G  —  ARC Long-Context Memory Test     ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

const arc = createArcAgent();

// ── Recall mode ───────────────────────────────────────────────────────────────

if (recallSession) {
  console.log(`Recalling session: ${recallSession}\n`);

  const ctx = await arc.getContext(recallSession);

  console.log(`── Session Context (${ctx.entryCount} entries) ─────────────────────────`);
  console.log(ctx.context);
  console.log(`── Root Hashes ────────────────────────────────────────────`);
  ctx.rootHashes.forEach((h, i) => console.log(`  [${i}] ${h}`));
  process.exit(0);
}

// ── Store mode ────────────────────────────────────────────────────────────────

const sessionId = crypto.randomUUID();
console.log(`New session: ${sessionId}\n`);

// 1. System prompt
console.log("── Step 1: Store system context ───────────────────────────");
const r1 = await arc.remember(
  sessionId,
  "system",
  "You are The Kitchen's autonomous agent fleet operating on 0G decentralized infrastructure. " +
    "Every agent decision is stored on 0G Storage, inference runs on 0G Compute, " +
    "and critical approvals are committed to 0G DA. Your mission: ship products autonomously.",
  { source: "system_init" }
);
console.log(`  rootHash: ${r1.rootHash}\n`);

// 2. User / task brief
console.log("── Step 2: Store product brief ─────────────────────────────");
const r2 = await arc.remember(
  sessionId,
  "user",
  "Build a tool for on-chain agent payment verification — " +
    "autonomous agents should be able to prove they completed work and collect payment without human sign-off.",
  { source: "product_brief", priority: "high" }
);
console.log(`  rootHash: ${r2.rootHash}\n`);

// 3. XEON analysis (assistant)
console.log("── Step 3: Store XEON decision ─────────────────────────────");
const r3 = await arc.remember(
  sessionId,
  "assistant",
  "[XEON] Product brief approved. Market signal: STRONG. " +
    "Dispatching NOVA for deep market analysis. Dispatching EMBR for content draft. " +
    "Decision committed to 0G DA.",
  { agent: "XEON", action: "approve_product" }
);
console.log(`  rootHash: ${r3.rootHash}\n`);

// 4. NOVA inference result (long content — tests long-context handling)
const novaAnalysis = `[NOVA] Market Analysis — On-Chain Agent Payment Verification

EXECUTIVE SUMMARY
─────────────────
Addressable market: $2.1B by 2026 (agent-to-agent payment rails)
Competition: No dominant player. Chainlink Functions adjacent but not agent-native.
Signal strength: HIGH

MARKET DRIVERS
──────────────
1. Autonomous agent proliferation — by 2026 >40% of software tasks will be partially
   handled by AI agents. Payment rails designed for humans are a bottleneck.

2. Trust deficit — agents cannot currently prove task completion on-chain.
   Human middlemen are required for payment release. This is the bottleneck we solve.

3. Regulatory tailwind — EU AI Act and US Executive Orders push toward
   "accountability by design". On-chain proofs satisfy compliance needs.

TECHNICAL GAP
─────────────
Current agent payment flows:
  Agent → (human verifies) → payment released

Target state:
  Agent → ZK proof of completion → smart contract → payment released

Every step auditable on 0G DA. No human in the loop.

COMPETITIVE LANDSCAPE
─────────────────────
- Chainlink Functions: oracle-based, not agent-native, high latency
- Gelato Network: automation-focused, no cryptographic proof of work
- 0G Compute: closest — decentralized inference, but no payment rail

RECOMMENDATION
──────────────
Build the payment verification primitive first. A Solidity contract that accepts:
  1. Agent task commitment (stored on 0G Storage)
  2. Completion proof (stored on 0G Storage)
  3. Verifier signature (from 0G Compute oracle)

Then release as open standard. Moat = network effects + early ecosystem adoption.

RISK FACTORS
────────────
- Smart contract risk (audit required before production)
- 0G testnet → mainnet migration timing unknown
- Competing standards may emerge from larger players (OpenAI, Anthropic)`;

console.log("── Step 4: Store NOVA analysis (long-context) ───────────────");
const r4 = await arc.remember(sessionId, "assistant", novaAnalysis, {
  agent: "NOVA",
  action: "market_analysis",
  wordCount: novaAnalysis.split(" ").length,
});
console.log(`  rootHash: ${r4.rootHash}\n`);

// 5. EMBR content draft
console.log("── Step 5: Store EMBR content draft ────────────────────────");
const r5 = await arc.remember(
  sessionId,
  "context",
  "[EMBR] Twitter thread drafted (4 tweets). Announcement copy ready. Reddit post ready. " +
    "Content queued for review — all assets reference verifiable on-chain state hashes.",
  { agent: "EMBR", action: "draft_content", assets: ["twitter", "announcement", "reddit"] }
);
console.log(`  rootHash: ${r5.rootHash}\n`);

// ── Recall and display ────────────────────────────────────────────────────────

console.log("── Recalling full session from 0G Storage ───────────────────");
const ctx = await arc.getContext(sessionId);

console.log(`\n✅ Session reconstructed — ${ctx.entryCount} entries from 0G Storage`);
console.log(`\nSession ID: ${sessionId}`);
console.log(`\nTo recall later:\n  npx tsx demo/test-arc.ts --recall ${sessionId}\n`);

console.log("── Context Preview (first 800 chars) ───────────────────────");
console.log(ctx.context.slice(0, 800) + (ctx.context.length > 800 ? "\n…(truncated)" : ""));

console.log("\n── On-Chain Proof ──────────────────────────────────────────");
console.log("  All entries stored on 0G Galileo V3 testnet:");
ctx.rootHashes.forEach((h, i) => {
  const roles = ["system", "user", "XEON", "NOVA", "EMBR"];
  console.log(`  [${roles[i] ?? i}] rootHash: ${h}`);
});

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║   ARC TEST COMPLETE — long-context memory on 0G Storage  ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

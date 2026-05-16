/**
 * PRISM — Standalone arbitrage revenue loop test
 *
 * Runs 2 arbitrage cycles to demonstrate the self-funded system narrative:
 *   Cycle 1: scan → score → execute → DA commit → reinvest → persist
 *   Cycle 2: restore prior state → same loop with compounded treasury
 *
 * Every executed trade gets an immutable 0G DA txHash.
 * Treasury state is stored on 0G Storage (content-addressed, verifiable).
 *
 * Usage:
 *   npm run test-prism
 */

import "dotenv/config";
import { PrismAgent } from "../agents/prism.js";

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   PRISM — On-Chain Arbitrage Revenue Loop                ║");
console.log("║   Self-Funded System · 0G Galileo V3 · Istanbul 2026    ║");
console.log("╚══════════════════════════════════════════════════════════╝");

const prism = new PrismAgent();

// Initialize — restores prior state from 0G Storage if available
await prism.initialize();

// Run 2 cycles to demonstrate the compounding self-funded loop
const cycle1 = await prism.runCycle();
const cycle2 = await prism.runCycle();

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║   PRISM REVENUE LOOP — SUMMARY                          ║");
console.log("╚══════════════════════════════════════════════════════════╝");

console.log(`\n  Seed capital:    $100.00`);
console.log(`  Treasury now:    $${prism.getTreasury().toFixed(2)}`);
console.log(`  Total PnL:       $${prism.getTotalPnl().toFixed(4)}`);
console.log(`  Cycles run:      ${prism.getCyclesCompleted()}`);
console.log(`  Compound return: +${(((prism.getTreasury() - 100) / 100) * 100).toFixed(4)}%`);

console.log("\n  Cycle 1:");
console.log(`    trades:        ${cycle1.trades_executed}`);
console.log(`    pnl:           $${cycle1.cycle_pnl_usd.toFixed(4)}`);
console.log(`    treasury:      $${cycle1.treasury_before_usd.toFixed(2)} → $${cycle1.treasury_after_usd.toFixed(2)}`);
console.log(`    storage_hash:  ${cycle1.stateHash}`);
console.log(`    da_commits:    ${cycle1.daCommits.length}`);
if (cycle1.daCommits[0]) {
  console.log(`    verify[0]:     ${cycle1.daCommits[0].explorerUrl}`);
}
console.log(`    via_0g_compute: ${cycle1.via_0g_compute}`);

console.log("\n  Cycle 2:");
console.log(`    trades:        ${cycle2.trades_executed}`);
console.log(`    pnl:           $${cycle2.cycle_pnl_usd.toFixed(4)}`);
console.log(`    treasury:      $${cycle2.treasury_before_usd.toFixed(2)} → $${cycle2.treasury_after_usd.toFixed(2)}`);
console.log(`    storage_hash:  ${cycle2.stateHash}`);
console.log(`    da_commits:    ${cycle2.daCommits.length}`);
if (cycle2.daCommits[0]) {
  console.log(`    verify[0]:     ${cycle2.daCommits[0].explorerUrl}`);
}
console.log(`    via_0g_compute: ${cycle2.via_0g_compute}`);

const allCommits = [...cycle1.daCommits, ...cycle2.daCommits];
if (allCommits.length > 0) {
  console.log("\n  On-chain trade commitments (0G DA):");
  allCommits.forEach((c, i) => {
    console.log(`    [${i + 1}] ${c.explorerUrl}`);
  });
}

console.log(`\n  On-chain storage (0G Storage):`);
console.log(`    Cycle 1: ${cycle1.stateHash}`);
console.log(`    Cycle 2: ${cycle2.stateHash}`);

console.log("\n  Self-funded loop: profits → treasury → next cycle");
console.log("  Every trade decision is immutable on 0G DA.\n");

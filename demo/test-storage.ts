/**
 * Phase 2 test: kill/restart recovery
 *
 * Run 1: XEON executes a task, writes state to 0G Storage
 * Run 2: XEON initializes, reads state from 0G Storage → confirms it restores
 */

import "dotenv/config";
import { XeonAgent } from "../agents/xeon.js";
import { NovaAgent } from "../agents/nova.js";

const args = process.argv.slice(2);
const isRestart = args.includes("--restart");

console.log("═══════════════════════════════════════════════════════════");
console.log(`  THE KITCHEN × 0G  —  Storage Test  (${isRestart ? "RESTART" : "FIRST RUN"})`);
console.log("═══════════════════════════════════════════════════════════");

const xeon = new XeonAgent();
const nova = new NovaAgent();

// Both agents initialize (read prior state if exists)
await xeon.initialize();
await nova.initialize();

if (!isRestart) {
  console.log("\n── Simulating task execution ──────────────────────────────");

  // XEON approves a product
  const xeonResult = await xeon.executeTask({
    type: "approve_product",
    payload: { name: "on-chain agent payment verification" },
  });

  // NOVA runs market analysis
  const novaResult = await nova.runInference({
    prompt: "Build a tool for on-chain agent payment verification",
  });

  console.log("\n── Results ────────────────────────────────────────────────");
  console.log(`XEON state hash: ${xeonResult.stateHash}`);
  console.log(`NOVA state hash: ${novaResult.stateHash}`);

  console.log("\n✅ Run complete. Now simulate a kill:");
  console.log("   npm run test-storage -- --restart");
} else {
  console.log("\n── Verifying state recovery after restart ─────────────────");

  const xeonState = xeon.getCurrentState();
  const novaState = nova.getCurrentState();

  if (xeonState) {
    console.log("\n✅ XEON state recovered from 0G Storage:");
    console.log(`   last_action:         ${xeonState.last_action}`);
    console.log(`   next_planned_action: ${xeonState.next_planned_action}`);
    console.log(`   timestamp:           ${xeonState.timestamp}`);
    console.log(`   prior session:       ${xeonState.session_id}`);
  } else {
    console.log("❌ XEON: no state recovered — run without --restart first");
  }

  if (novaState) {
    console.log("\n✅ NOVA state recovered from 0G Storage:");
    console.log(`   last_action:  ${novaState.last_action}`);
    console.log(`   timestamp:    ${novaState.timestamp}`);
  } else {
    console.log("❌ NOVA: no state recovered — run without --restart first");
  }
}

console.log("\n═══════════════════════════════════════════════════════════\n");

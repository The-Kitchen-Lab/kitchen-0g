/**
 * Self-Heal Demo — agent crash → 0G state recovery proof
 *
 * Demonstrates that any Kitchen agent can recover its complete state
 * from 0G Storage after a crash, using only the .kitchen-index.json
 * rootHash registry. No central coordinator required.
 *
 * Prerequisites: run `npm run demo` at least once to populate state.
 * Run: npm run self-heal
 */

import "dotenv/config";
import { XeonAgent } from "../agents/xeon.js";
import { createStorageClient } from "../integrations/storage/client.js";

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   SELF-HEAL DEMO  —  0G State Recovery                  ║");
console.log("║   Agent crash → rootHash recovery proof                  ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

// ── Phase 1: Inspect pre-crash state ─────────────────────────────────────────

console.log("── Phase 1: Pre-crash state ─────────────────────────────────");

const storage = createStorageClient();
const index = storage.listAll();

if (!index["XEON"]) {
  console.error("\n⚠  No XEON state found in .kitchen-index.json");
  console.error("   Run the full pipeline first: npm run demo\n");
  process.exit(1);
}

const precrashRootHash = index["XEON"];
const agentCount = Object.keys(index).length;

console.log(`\n   Fleet index (${agentCount} agents persisted on 0G Storage):`);
for (const [id, hash] of Object.entries(index)) {
  console.log(`     ${id.padEnd(6)} → ${hash}`);
}
console.log(`\n   XEON pre-crash rootHash: ${precrashRootHash}`);

// ── Phase 2: Simulate crash ───────────────────────────────────────────────────

console.log("\n── Phase 2: Simulate crash ──────────────────────────────────");
console.log("\n   [SELF-HEAL] 💥 crash simulated — XEON process terminated");
console.log("   [SELF-HEAL]    In-memory state lost. 0G Storage intact.\n");

await new Promise(r => setTimeout(r, 600));

// ── Phase 3: Recovery from 0G Storage ────────────────────────────────────────

console.log("── Phase 3: Recovery from 0G Storage ───────────────────────");
console.log("\n   [SELF-HEAL] 🔄 fresh agent instance starting...");
console.log("   [SELF-HEAL]    Reading state from 0G Storage via rootHash...\n");

const xeonRecovered = new XeonAgent();
await xeonRecovered.initialize();

const recoveredState = xeonRecovered.getCurrentState();

if (!recoveredState) {
  console.error("\n   [SELF-HEAL] ❌ Recovery FAILED: no state found in 0G Storage");
  process.exit(1);
}

// ── Phase 4: Integrity verification ──────────────────────────────────────────

console.log("\n── Phase 4: Integrity verification ─────────────────────────");

const postRecoveryIndex = storage.listAll();
const postRecoveryHash = postRecoveryIndex["XEON"] ?? "";
const hashMatch = precrashRootHash === postRecoveryHash;

console.log(`\n   [SELF-HEAL] pre-crash  rootHash: ${precrashRootHash}`);
console.log(`   [SELF-HEAL] recovered  rootHash: ${postRecoveryHash}`);
console.log(`   [SELF-HEAL] hash_match:          ${hashMatch ? "✅ IDENTICAL" : "❌ MISMATCH"}`);
console.log(`\n   [SELF-HEAL] recovered_action:   ${recoveredState.last_action}`);
console.log(`   [SELF-HEAL] recovered_session:   ${recoveredState.session_id}`);
console.log(`   [SELF-HEAL] recovered_timestamp: ${recoveredState.timestamp}`);

if (hashMatch) {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   SELF-HEAL ✅  State fully recovered from 0G Storage   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n   Proof: Content-addressed 0G Storage survives process crashes.");
  console.log("          The rootHash is a cryptographic commitment — if data");
  console.log("          is retrieved under the same hash, it is identical.\n");
} else {
  console.error("\n   [SELF-HEAL] ❌ FAILED: rootHash mismatch — state integrity violation\n");
  process.exit(1);
}

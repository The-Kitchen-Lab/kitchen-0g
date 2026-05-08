/**
 * Phase 4 test: 0G DA audit trail
 *
 * XEON approves a product → state written to 0G Storage → commitment to 0G DA
 * Logs txHash + explorer link for on-chain verification.
 */

import "dotenv/config";
import { XeonAgent } from "../agents/xeon.js";

console.log("═══════════════════════════════════════════════════════════");
console.log("  THE KITCHEN × 0G  —  DA Audit Trail Test");
console.log("═══════════════════════════════════════════════════════════");

const xeon = new XeonAgent();
await xeon.initialize();

console.log("\n── XEON: approve_product (triggers DA commit) ─────────────");
const result = await xeon.executeTask({
  type: "approve_product",
  payload: { name: "on-chain agent payment verification" },
});

console.log("\n── Audit Trail ────────────────────────────────────────────");
if (result.daCommit) {
  console.log(`✅ Decision committed to 0G DA`);
  console.log(`   data_root:   ${result.daCommit.dataRoot}`);
  console.log(`   txHash:      ${result.daCommit.txHash}`);
  console.log(`   verify:      ${result.daCommit.explorerUrl}`);
  console.log(`\n   Payload committed:`);
  console.log(`   ${JSON.stringify(result.daCommit.payload, null, 2).replace(/\n/g, "\n   ")}`);
} else {
  console.log("ℹ  No DA commit (task type does not trigger DA)");
}

console.log(`\n   Storage hash: ${result.stateHash}`);
console.log("\n═══════════════════════════════════════════════════════════\n");

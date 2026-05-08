/**
 * Phase 3 test: 0G Compute integration
 *
 * 1. Lists live providers on 0G Compute testnet (read-only, no ledger)
 * 2. Runs inference (live via 0G Compute if ≥3 OG, stub otherwise)
 */

import "dotenv/config";
import { createComputeClient } from "../integrations/compute/nova_inference.js";
import { ethers } from "ethers";

console.log("═══════════════════════════════════════════════════════════");
console.log("  THE KITCHEN × 0G  —  Compute Test");
console.log("═══════════════════════════════════════════════════════════\n");

const client = createComputeClient();

// 1. List providers (no ledger needed)
const providers = await client.listProviders();

if (providers.length === 0) {
  console.log("❌ No providers found on 0G Compute testnet");
} else {
  console.log(`\n✅ ${providers.length} provider(s) available on 0G Compute:`);
  providers.slice(0, 3).forEach((p, i) => {
    console.log(`   [${i + 1}] ${p.address}`);
    console.log(`       model: ${p.model}`);
    console.log(`       url:   ${p.url}`);
  });
}

// 2. Balance check
const provider = new ethers.JsonRpcProvider(process.env.ZG_EVM_RPC!);
const balance = await provider.getBalance("0x608F727E19B7B91f2BAbc71F03b9464956CC469b");
const balOG = parseFloat(ethers.formatEther(balance));
console.log(`\nWallet balance: ${balOG.toFixed(4)} OG`);
console.log(`Ledger minimum: 3.0 OG`);
console.log(`Status: ${balOG >= 3 ? "✅ Can run live inference" : "⚠  Need " + (3 - balOG).toFixed(2) + " more OG from faucet"}`);

// 3. Run inference (live or stub)
console.log("\n── Running NOVA inference ─────────────────────────────────");
const result = await client.runInference({
  prompt: "Build a tool for on-chain agent payment verification",
  systemPrompt: "You are NOVA, an AI/ML agent in The Kitchen. Analyze market fit.",
  maxTokens: 600,
});

console.log(`\n── Result ─────────────────────────────────────────────────`);
console.log(`via_0g_compute:  ${result.via_0g_compute}`);
console.log(`compute_job_id:  ${result.compute_job_id ?? "null (stub mode)"}`);
console.log(`provider:        ${result.provider_address ?? "null (stub mode)"}`);
console.log(`model:           ${result.model}`);
console.log(`\nCompletion preview:`);
console.log(result.completion.slice(0, 300) + "...");

console.log("\n═══════════════════════════════════════════════════════════\n");

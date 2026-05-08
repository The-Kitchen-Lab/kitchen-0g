/**
 * 0G Compute wrapper for NOVA inference.
 *
 * Routes NOVA's market analysis inference through 0G Compute Network.
 * Uses OpenAI-compatible API with on-chain payment headers.
 *
 * Setup flow:
 *   1. createReadOnlyInferenceBroker → list available providers (no ledger needed)
 *   2. createInferenceBroker         → authenticated inference (requires 3+ OG ledger)
 *   3. getServiceMetadata            → endpoint + model from selected provider
 *   4. getRequestHeaders             → billing proof headers
 *   5. OpenAI-compatible fetch       → actual inference call
 *   6. processResponse               → verify + cache fee estimate
 *
 * Fallback: if ledger is not funded (< 3 OG), stub mode is used and
 * compute_job_id is set to null. Fund the ledger to activate live inference.
 */

// CJS interop — the SDK's ESM build is broken (package "type" mismatch).
// Load the working CJS build directly by path.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const _require = createRequire(import.meta.url);
const _sdkPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../node_modules/@0gfoundation/0g-compute-ts-sdk/lib.commonjs/index.js"
);
const {
  createReadOnlyInferenceBroker,
  createInferenceBroker,
  LedgerBroker,
  CONTRACT_ADDRESSES,
} = _require(_sdkPath) as typeof import("@0gfoundation/0g-compute-ts-sdk");
import { ethers } from "ethers";

// ── Types ────────────────────────────────────────────────────────────────────

export interface InferenceRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
}

export interface InferenceResult {
  completion: string;
  model: string;
  provider_address: string | null;
  compute_job_id: string | null;   // 0G Compute job ID (from response header ZG-Res-Key)
  via_0g_compute: boolean;
}

export interface ProviderInfo {
  address: string;
  url: string;
  model: string;
}

// ── ComputeClient ─────────────────────────────────────────────────────────────

export class ComputeClient {
  private rpc: string;
  private privateKey: string;
  private wallet: ethers.Wallet;

  constructor(evmRpc: string, privateKey: string) {
    this.rpc = evmRpc;
    this.privateKey = privateKey;
    const provider = new ethers.JsonRpcProvider(evmRpc);
    this.wallet = new ethers.Wallet(privateKey, provider);
  }

  /**
   * List available inference providers on 0G Compute.
   * Read-only — does NOT require a ledger.
   */
  async listProviders(): Promise<ProviderInfo[]> {
    console.log("[0G Compute] Listing available inference providers...");

    const broker = await createReadOnlyInferenceBroker(this.rpc);
    const services = await broker.listService(0, 20, false);

    const providers: ProviderInfo[] = services.map((svc) => ({
      address: svc.provider,
      url: svc.url,
      model: svc.model,
    }));

    console.log(`[0G Compute] Found ${providers.length} provider(s):`);
    providers.forEach((p, i) => {
      console.log(`             [${i + 1}] ${p.address.slice(0, 10)}... model=${p.model}`);
    });

    return providers;
  }

  /**
   * Run inference via 0G Compute Network.
   *
   * Requires a funded ledger (≥3 OG). If balance is insufficient,
   * falls back to local stub and sets via_0g_compute = false.
   */
  async runInference(req: InferenceRequest): Promise<InferenceResult> {
    const balance = await this.wallet.provider!.getBalance(this.wallet.address);
    const balanceOG = parseFloat(ethers.formatEther(balance));

    if (balanceOG < 3.0) {
      console.log(`[0G Compute] ⚠  Wallet balance ${balanceOG.toFixed(4)} OG < 3 OG minimum for ledger`);
      console.log(`[0G Compute]    Falling back to stub — fund with 3+ OG to activate live compute`);
      console.log(`[0G Compute]    Faucet: https://faucet.0g.ai → ${this.wallet.address}`);
      return this.runStub(req);
    }

    try {
      return await this.runVia0GCompute(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[0G Compute] ⚠  Live inference failed: ${msg.slice(0, 80)}`);
      console.log(`[0G Compute]    Falling back to stub`);
      return this.runStub(req);
    }
  }

  private async runVia0GCompute(req: InferenceRequest): Promise<InferenceResult> {
    const contracts = CONTRACT_ADDRESSES.testnet;

    // 1. Create / connect ledger
    console.log("[0G Compute] Connecting to on-chain ledger...");
    const ledgerBroker = new LedgerBroker(
      this.wallet,
      contracts.ledger,
      contracts.inference,
      contracts.fineTuning
    );
    await ledgerBroker.initialize();

    // Ensure ledger exists
    let ledgerExists = false;
    try {
      await ledgerBroker.getLedger();
      ledgerExists = true;
      console.log("[0G Compute] Ledger found");
    } catch {
      console.log("[0G Compute] No ledger — creating with 3 OG...");
      await ledgerBroker.addLedger(3);
      console.log("[0G Compute] Ledger created");
    }

    // 2. Create inference broker
    const inferenceBroker = await createInferenceBroker(
      this.wallet,
      contracts.inference,
      ledgerBroker
    );

    // 3. Pick first available provider
    const services = await inferenceBroker.listService(0, 10, false);
    if (services.length === 0) throw new Error("No inference providers available");

    const provider = services[0];
    const providerAddress = provider.provider;
    console.log(`[0G Compute] Using provider: ${providerAddress.slice(0, 12)}...`);

    // 4. Get service metadata (endpoint + model)
    const { endpoint, model } = await inferenceBroker.getServiceMetadata(providerAddress);
    const modelToUse = req.model ?? model;
    console.log(`[0G Compute] Endpoint: ${endpoint} | Model: ${modelToUse}`);

    // 5. Build messages
    const messages: Array<{ role: string; content: string }> = [];
    if (req.systemPrompt) {
      messages.push({ role: "system", content: req.systemPrompt });
    }
    messages.push({ role: "user", content: req.prompt });

    // 6. Get billing headers (on-chain payment proof)
    const headers = await inferenceBroker.getRequestHeaders(providerAddress, req.prompt);

    // 7. Make OpenAI-compatible call
    console.log("[0G Compute] Sending inference request...");
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers as Record<string, string>,
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        max_tokens: req.maxTokens ?? 800,
        stream: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`0G Compute HTTP ${response.status}: ${body.slice(0, 100)}`);
    }

    const data = await response.json() as {
      id: string;
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    // 8. Process response (verify + cache fee)
    const chatID = response.headers.get("ZG-Res-Key") ?? data.id;
    const usageStr = data.usage ? JSON.stringify(data.usage) : "";
    await inferenceBroker.processResponse(providerAddress, chatID, usageStr);

    const completion = data.choices[0]?.message?.content ?? "";

    console.log(`[0G Compute] ✅ Inference complete`);
    console.log(`             compute_job_id: ${chatID}`);
    console.log(`             provider:       ${providerAddress}`);

    return {
      completion,
      model: modelToUse,
      provider_address: providerAddress,
      compute_job_id: chatID,
      via_0g_compute: true,
    };
  }

  private async runStub(req: InferenceRequest): Promise<InferenceResult> {
    await new Promise(r => setTimeout(r, 300));

    const completion = `Market Analysis Report [STUB — 0G Compute pending 3 OG ledger]

Product Brief: ${req.prompt.slice(0, 100)}

Executive Summary:
The on-chain agent payment verification market is nascent but growing rapidly.
Key drivers: DeFi automation, autonomous agent adoption, trustless payment rails.

Market Fit Signal: STRONG
- Addressable market: $2.1B (2026 estimate)
- Competitive landscape: 3 early movers, no dominant player
- Technical moat: cryptographic verification layer is non-trivial to replicate

Recommended next step: ship MVP focused on EVM-compatible verification,
expand to Solana in Q3. Price: $0.001 per verification.

Confidence: 0.78 | Compute: 0G Network (fund ledger to activate)`;

    console.log("[0G Compute] ⚡ Stub inference complete (via_0g_compute=false)");

    return {
      completion,
      model: req.model ?? "llama-3.1-8b-instruct",
      provider_address: null,
      compute_job_id: null,
      via_0g_compute: false,
    };
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createComputeClient(): ComputeClient {
  const evmRpc = process.env.ZG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
  const privateKey = process.env.ZG_PRIVATE_KEY;
  if (!privateKey) throw new Error("ZG_PRIVATE_KEY is not set in environment");
  return new ComputeClient(evmRpc, privateKey);
}

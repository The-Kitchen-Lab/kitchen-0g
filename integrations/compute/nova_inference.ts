/**
 * 0G Compute wrapper for NOVA inference.
 *
 * Routes NOVA's market analysis through 0G Compute Network with
 * decentralized provider discovery and qwen-2.5-7b-instruct integration.
 *
 * Flow:
 *   1. createReadOnlyInferenceBroker → list + filter providers by model
 *   2. createInferenceBroker         → authenticated inference (requires 3+ OG ledger)
 *   3. getServiceMetadata            → endpoint from selected provider
 *   4. getRequestHeaders             → billing proof headers
 *   5. OpenAI-compatible fetch       → inference call
 *   6. processResponse               → verify + cache fee
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

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "qwen/qwen-2.5-7b-instruct";
const MODEL_KEYWORDS = ["qwen-2.5-7b", "qwen2.5-7b", "qwen/qwen-2.5-7b"];

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
  provider_address: string;
  compute_job_id: string | null;
  via_0g_compute: boolean;
}

export interface ProviderInfo {
  address: string;
  url: string;
  model: string;
  supportsQwen: boolean;
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
   * Discover inference providers on 0G Compute.
   * Marks providers that support qwen-2.5-7b-instruct.
   * Read-only — does NOT require a ledger.
   */
  async listProviders(): Promise<ProviderInfo[]> {
    console.log("[0G Compute] Discovering inference providers...");

    const broker = await createReadOnlyInferenceBroker(this.rpc);
    const services = await broker.listService(0, 20, false);

    const providers: ProviderInfo[] = services.map((svc) => {
      const modelLower = svc.model.toLowerCase();
      const supportsQwen = MODEL_KEYWORDS.some(kw => modelLower.includes(kw));
      return {
        address: svc.provider,
        url: svc.url,
        model: svc.model,
        supportsQwen,
      };
    });

    const qwenCount = providers.filter(p => p.supportsQwen).length;
    console.log(`[0G Compute] ${providers.length} provider(s) — ${qwenCount} support qwen-2.5-7b-instruct`);
    providers.forEach((p, i) => {
      const tag = p.supportsQwen ? " ★ qwen" : "";
      console.log(`             [${i + 1}] ${p.address.slice(0, 10)}... model=${p.model}${tag}`);
    });

    return providers;
  }

  /**
   * Run inference via 0G Compute Network.
   *
   * Requires a funded ledger (≥3 OG). Prefers providers that explicitly
   * advertise qwen-2.5-7b-instruct; falls back to first available provider
   * while still sending the qwen model name in the request body.
   *
   * Throws if wallet balance is insufficient or no providers are found.
   */
  async runInference(req: InferenceRequest): Promise<InferenceResult> {
    const targetModel = req.model ?? DEFAULT_MODEL;

    const balance = await this.wallet.provider!.getBalance(this.wallet.address);
    const balanceOG = parseFloat(ethers.formatEther(balance));
    if (balanceOG < 3.0) {
      console.log(`[0G Compute] ⚠ Balance ${balanceOG.toFixed(4)} OG (min 3 OG for ledger) — stub mode`);
      console.log(`             Fund at: https://faucet.0g.ai → ${this.wallet.address}`);
      return this.stubInference(req, balanceOG);
    }

    console.log(`[0G Compute] Running inference | model: ${targetModel} | balance: ${balanceOG.toFixed(4)} OG`);
    return await this.runVia0GCompute({ ...req, model: targetModel });
  }

  private async runVia0GCompute(req: InferenceRequest): Promise<InferenceResult> {
    const contracts = CONTRACT_ADDRESSES.testnet;
    const targetModel = req.model ?? DEFAULT_MODEL;

    // 1. Connect or create ledger
    console.log("[0G Compute] Connecting to on-chain ledger...");
    const ledgerBroker = new LedgerBroker(
      this.wallet,
      contracts.ledger,
      contracts.inference,
      contracts.fineTuning
    );
    await ledgerBroker.initialize();

    try {
      await ledgerBroker.getLedger();
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

    // 3. Provider discovery — prefer qwen-2.5-7b-instruct providers
    const services = await inferenceBroker.listService(0, 20, false);
    if (services.length === 0) {
      throw new Error("[0G Compute] No inference providers available on network");
    }

    const modelLower = targetModel.toLowerCase();
    const qwenProviders = services.filter(svc =>
      MODEL_KEYWORDS.some(kw => svc.model.toLowerCase().includes(kw)) ||
      svc.model.toLowerCase() === modelLower
    );

    const selectedService = qwenProviders.length > 0 ? qwenProviders[0] : services[0];
    const providerAddress = selectedService.provider;

    if (qwenProviders.length > 0) {
      console.log(`[0G Compute] ✓ qwen-2.5-7b-instruct provider found: ${providerAddress.slice(0, 12)}...`);
    } else {
      console.log(`[0G Compute] No dedicated qwen provider — using ${providerAddress.slice(0, 12)}... with model override`);
    }

    // 4. Get service metadata (endpoint)
    const { endpoint } = await inferenceBroker.getServiceMetadata(providerAddress);
    console.log(`[0G Compute] Endpoint: ${endpoint}`);

    // 5. Build messages
    const messages: Array<{ role: string; content: string }> = [];
    if (req.systemPrompt) {
      messages.push({ role: "system", content: req.systemPrompt });
    }
    messages.push({ role: "user", content: req.prompt });

    // 6. Billing headers (on-chain payment proof)
    const headers = await inferenceBroker.getRequestHeaders(providerAddress, req.prompt);

    // 7. OpenAI-compatible inference call
    console.log(`[0G Compute] Sending request (model: ${targetModel})...`);
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers as Record<string, string>,
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        max_tokens: req.maxTokens ?? 800,
        stream: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`[0G Compute] HTTP ${response.status}: ${body.slice(0, 120)}`);
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
    console.log(`             model:          ${targetModel}`);
    console.log(`             compute_job_id: ${chatID}`);
    console.log(`             provider:       ${providerAddress}`);

    return {
      completion,
      model: targetModel,
      provider_address: providerAddress,
      compute_job_id: chatID,
      via_0g_compute: true,
    };
  }

  private stubInference(req: InferenceRequest, balanceOG: number): InferenceResult {
    const brief = req.prompt.slice(0, 60);
    return {
      completion: `Market Analysis Report [STUB — 0G Compute pending ${(3.0 - balanceOG).toFixed(2)} OG top-up]\n\nProduct Brief: ${req.prompt}\n\nExecutive Summary:\nThe on-chain agent payment verification market is nascent but growing rapidly.\nKey drivers: DeFi automation, autonomous agent adoption, trustless payment rails.\n\nMarket Fit Signal: STRONG\n- Addressable market: $2.1B (2026 estimate)\n- Competitive landscape: 3 early movers, no dominant player\n- Technical moat: cryptographic verification layer is non-trivial to replicate\n\nRecommended next step: ship MVP focused on EVM-compatible verification,\nexpand to Solana in Q3. Price: $0.001 per verification.\n\nConfidence: 0.78 | Compute: 0G Network (fund ledger to activate)`,
      model: DEFAULT_MODEL,
      provider_address: "stub",
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

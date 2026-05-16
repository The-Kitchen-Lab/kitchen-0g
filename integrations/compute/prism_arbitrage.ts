/**
 * 0G Compute integration for PRISM arbitrage opportunity scoring.
 *
 * Routes price-signal analysis through 0G Compute Network.
 * Falls back to deterministic simulated feeds when balance < 3 OG.
 *
 * Stub mode generates realistic price discrepancies for 5 pairs
 * (0G/USDT, ETH/USDT, MATIC/USDT, BTC/USDT, SOL/USDT), replicating
 * what a live DEX/CEX scanner would produce on Galileo V3.
 */

// CJS interop — same pattern as nova_inference.ts
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const _require = createRequire(import.meta.url);
const _sdkPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../node_modules/@0gfoundation/0g-compute-ts-sdk/lib.commonjs/index.js"
);
const {
  createInferenceBroker,
  LedgerBroker,
  CONTRACT_ADDRESSES,
} = _require(_sdkPath) as typeof import("@0gfoundation/0g-compute-ts-sdk");
import { ethers } from "ethers";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ArbitrageOpportunity {
  pair: string;
  venue_a: string;
  venue_b: string;
  price_a: number;
  price_b: number;
  spread_pct: number;
  estimated_profit_usd: number;
  confidence: number;
  size_usd: number;
}

export interface ScanResult {
  opportunities: ArbitrageOpportunity[];
  via_0g_compute: boolean;
}

// ── Simulated price feed data ─────────────────────────────────────────────────

// Price bases — realistic Galileo V3 testnet liquidity simulation.
// Jitter applied on each call to simulate live market movement.
const PRICE_BASES = [
  {
    pair: "0G/USDT",
    venue_a: "ZeroSwap-A",
    venue_b: "ZeroSwap-B",
    price_a: 1.231,
    price_b: 1.252,
    confidence: 0.82,    // well above threshold — high signal
  },
  {
    pair: "ETH/USDT",
    venue_a: "GalileoAMM",
    venue_b: "ZeroSwap-A",
    price_a: 3204.5,
    price_b: 3221.3,
    confidence: 0.71,    // above threshold
  },
  {
    pair: "MATIC/USDT",
    venue_a: "GalileoAMM",
    venue_b: "ZeroSwap-B",
    price_a: 0.8812,
    price_b: 0.8898,
    confidence: 0.69,    // above threshold
  },
  {
    pair: "BTC/USDT",
    venue_a: "ZeroSwap-A",
    venue_b: "GalileoAMM",
    price_a: 67892.0,
    price_b: 68145.0,
    confidence: 0.57,    // below 0.65 threshold — filtered out
  },
  {
    pair: "SOL/USDT",
    venue_a: "ZeroSwap-B",
    venue_b: "GalileoAMM",
    price_a: 182.4,
    price_b: 182.92,
    confidence: 0.48,    // below threshold — filtered out
  },
];

function generatePriceFeeds(treasury: number): ArbitrageOpportunity[] {
  const jitter = () => 1 + (Math.random() - 0.5) * 0.002; // ±0.1% market noise

  return PRICE_BASES.map(p => {
    const price_a = p.price_a * jitter();
    const price_b = p.price_b * jitter();
    const spread_pct = ((price_b - price_a) / price_a) * 100;

    // Allocate 15–25% of treasury per opportunity, capped at $50
    const size_usd = Math.min(treasury * (0.15 + Math.random() * 0.10), 50);
    const estimated_profit_usd = (size_usd * Math.max(spread_pct, 0)) / 100 * p.confidence;

    return {
      pair: p.pair,
      venue_a: p.venue_a,
      venue_b: p.venue_b,
      price_a,
      price_b,
      spread_pct,
      estimated_profit_usd,
      confidence: p.confidence,
      size_usd,
    };
  });
}

// ── ArbitrageClient ───────────────────────────────────────────────────────────

export class ArbitrageClient {
  private rpc: string;
  private wallet: ethers.Wallet;

  constructor(evmRpc: string, privateKey: string) {
    this.rpc = evmRpc;
    const provider = new ethers.JsonRpcProvider(evmRpc);
    this.wallet = new ethers.Wallet(privateKey, provider);
  }

  /**
   * Scan for arbitrage opportunities.
   * Routes through 0G Compute if balance ≥ 3 OG, else uses stub.
   */
  async scanOpportunities(treasury: number): Promise<ScanResult> {
    const balance = await this.wallet.provider!.getBalance(this.wallet.address);
    const balanceOG = parseFloat(ethers.formatEther(balance));

    console.log(`[PRISM Compute] Wallet: ${balanceOG.toFixed(4)} OG`);

    if (balanceOG < 3.0) {
      console.log(`[PRISM Compute] ⚡ Stub mode — fund 3 OG to activate live 0G Compute scoring`);
      console.log(`[PRISM Compute]    Faucet: https://faucet.0g.ai → ${this.wallet.address}`);
      return this.runStub(treasury);
    }

    try {
      return await this.runVia0GCompute(treasury);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[PRISM Compute] ⚠  Live compute failed: ${msg.slice(0, 60)} — falling back to stub`);
      return this.runStub(treasury);
    }
  }

  private async runVia0GCompute(treasury: number): Promise<ScanResult> {
    const contracts = CONTRACT_ADDRESSES.testnet;
    console.log("[PRISM Compute] Connecting to 0G Compute for opportunity scoring...");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ledgerBroker = new LedgerBroker(
      this.wallet as any,
      contracts.ledger,
      contracts.inference,
      contracts.fineTuning
    );
    await ledgerBroker.initialize();

    try {
      await ledgerBroker.getLedger();
      console.log("[PRISM Compute] Ledger found");
    } catch {
      console.log("[PRISM Compute] No ledger — creating with 3 OG...");
      await ledgerBroker.addLedger(3);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inferenceBroker = await createInferenceBroker(
      this.wallet as any,
      contracts.inference,
      ledgerBroker
    );

    const services = await inferenceBroker.listService(0, 10, false);
    if (services.length === 0) throw new Error("No inference providers available");

    const provider = services[0];
    const { endpoint, model } = await inferenceBroker.getServiceMetadata(provider.provider);

    const feeds = generatePriceFeeds(treasury);
    const feedSummary = feeds
      .map(f => `${f.pair}: A=${f.price_a.toFixed(4)} B=${f.price_b.toFixed(4)} spread=${f.spread_pct.toFixed(3)}%`)
      .join("\n");

    const prompt =
      `You are PRISM, an on-chain arbitrage scoring engine. Score these price discrepancies.\n\n` +
      `Market feeds:\n${feedSummary}\n\n` +
      `Treasury: $${treasury.toFixed(2)} USD\n\n` +
      `Respond as JSON array only: [{"pair":"0G/USDT","confidence":0.82,"rationale":"..."},...]`;

    const headers = await inferenceBroker.getRequestHeaders(provider.provider, prompt);
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers as unknown as Record<string, string>),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        stream: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`0G Compute HTTP ${response.status}: ${body.slice(0, 80)}`);
    }

    const data = await response.json() as {
      id: string;
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const chatID = response.headers.get("ZG-Res-Key") ?? data.id;
    const usageStr = data.usage ? JSON.stringify(data.usage) : "";
    await inferenceBroker.processResponse(provider.provider, chatID, usageStr);

    // Merge LLM confidence scores into simulated price feeds
    const content = data.choices[0]?.message?.content ?? "[]";
    let scores: Array<{ pair: string; confidence: number }> = [];
    try {
      const parsed = JSON.parse(content);
      scores = Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.runStub(treasury);
    }

    const scored = feeds.map(f => {
      const llm = scores.find(s => s.pair === f.pair);
      return { ...f, confidence: llm?.confidence ?? f.confidence };
    });

    console.log(`[PRISM Compute] ✅ 0G Compute scoring done — job_id: ${chatID}`);
    return { opportunities: scored, via_0g_compute: true };
  }

  private runStub(treasury: number): ScanResult {
    const opportunities = generatePriceFeeds(treasury);

    console.log("[PRISM Compute] Price feeds:");
    opportunities.forEach(o => {
      const status = o.confidence >= 0.65 && o.spread_pct >= 0.5 ? "✓" : "✗";
      console.log(
        `               ${status} ${o.pair.padEnd(12)} spread=${o.spread_pct.toFixed(3)}%` +
        ` conf=${o.confidence.toFixed(2)} size=$${o.size_usd.toFixed(2)}`
      );
    });

    return { opportunities, via_0g_compute: false };
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createArbitrageClient(): ArbitrageClient {
  const evmRpc = process.env.ZG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
  const privateKey = process.env.ZG_PRIVATE_KEY;
  if (!privateKey) throw new Error("ZG_PRIVATE_KEY is not set in environment");
  return new ArbitrageClient(evmRpc, privateKey);
}

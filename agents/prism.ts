/**
 * PRISM — Crypto Arbitrage & Revenue Lead
 *
 * Monitors price discrepancies across on-chain and reference markets,
 * simulates arbitrage positions, and manages the Kitchen treasury.
 *
 * Every cycle:
 *   1. Scans for price opportunities (simulated on testnet)
 *   2. NOVA analyzes risk via 0G Compute (routed through XEON)
 *   3. Executes position (simulated on testnet, real on mainnet)
 *   4. Writes full position state to 0G Storage (verifiable P&L)
 *   5. Commits trade decision to 0G DA (immutable treasury audit trail)
 *
 * Self-funded loop: PRISM generates revenue → funds XEON/NOVA/EMBR operations.
 * On-chain proof: every position has a DA txHash anyone can verify.
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";
import { createAuditClient, CommitResult } from "../integrations/da/audit.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ArbitrageOpportunity {
  pair: string;
  buy_venue: string;
  sell_venue: string;
  buy_price: number;
  sell_price: number;
  spread_pct: number;
  estimated_profit_usd: number;
}

export interface TradePosition {
  position_id: string;
  pair: string;
  entry_price: number;
  exit_price: number;
  size_usd: number;
  pnl_usd: number;
  pnl_pct: number;
  buy_venue: string;
  sell_venue: string;
  status: "open" | "closed" | "cancelled";
  rationale: string;
  risk_score: number;
  timestamp: string;
}

export interface PrismLoopResult {
  cycles_run: number;
  cycles_profitable: number;
  cycles_rejected: number;
  cycles_no_opportunity: number;
  loop_pnl_usd: number;
  positions: TradePosition[];
  last_cycle: PrismCycleResult;
  treasury: {
    loop_pnl_usd: number;
    cumulative_pnl_usd: number;
    positions_closed: number;
  };
}

export interface PrismCycleResult {
  cycle_id: string;
  opportunities_scanned: number;
  opportunity: ArbitrageOpportunity | null;
  position: TradePosition | null;
  action: "trade_executed" | "no_opportunity" | "risk_rejected";
  stateHash: string;
  daCommit: CommitResult | null;
  treasury: {
    cycle_pnl_usd: number;
    cumulative_pnl_usd: number;
    positions_closed: number;
  };
}

// ── Market data simulation ────────────────────────────────────────────────────

const PAIRS = ["BTC/USDC", "ETH/USDC", "SOL/USDC"];
const VENUES = ["0G-DEX", "Uniswap-V3", "Chainlink-Oracle"];

function simulateMarketScan(): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  for (const pair of PAIRS) {
    const basePrices: Record<string, number> = {
      "BTC/USDC": 65_000 + (Math.random() - 0.5) * 2000,
      "ETH/USDC": 3_400 + (Math.random() - 0.5) * 200,
      "SOL/USDC": 170 + (Math.random() - 0.5) * 20,
    };
    const base = basePrices[pair];

    // Simulate a spread — occasionally actionable (>0.15%)
    const spreadFactor = Math.random();
    const buyVenueIdx = Math.floor(Math.random() * VENUES.length);
    const sellVenueIdx = (buyVenueIdx + 1 + Math.floor(Math.random() * (VENUES.length - 1))) % VENUES.length;

    const spreadPct = spreadFactor * 0.5; // max 0.5%
    const buyPrice = base * (1 - spreadPct / 200);
    const sellPrice = base * (1 + spreadPct / 200);
    const sizeUsd = 5_000;
    const estimatedProfit = (sizeUsd * spreadPct) / 100 - sizeUsd * 0.0006; // minus 0.06% fees

    if (spreadPct > 0.15 && estimatedProfit > 0) {
      opportunities.push({
        pair,
        buy_venue: VENUES[buyVenueIdx],
        sell_venue: VENUES[sellVenueIdx],
        buy_price: parseFloat(buyPrice.toFixed(4)),
        sell_price: parseFloat(sellPrice.toFixed(4)),
        spread_pct: parseFloat(spreadPct.toFixed(4)),
        estimated_profit_usd: parseFloat(estimatedProfit.toFixed(2)),
      });
    }
  }

  return opportunities.sort((a, b) => b.estimated_profit_usd - a.estimated_profit_usd);
}

function assessRisk(opp: ArbitrageOpportunity): { score: number; rationale: string } {
  let score = 0.2;
  let flags: string[] = [];

  if (opp.spread_pct > 0.4) { score += 0.15; flags.push("high spread — possible liquidity gap"); }
  if (opp.estimated_profit_usd < 2) { score += 0.2; flags.push("thin margin — fees may eat profit"); }
  if (opp.buy_venue === "Chainlink-Oracle") { score += 0.1; flags.push("oracle venue — price lag risk"); }

  return {
    score: parseFloat(Math.min(score, 0.95).toFixed(3)),
    rationale: flags.length > 0
      ? `Risk factors: ${flags.join("; ")}`
      : "Clean spread, adequate margin, standard venues",
  };
}

// ── PrismAgent ────────────────────────────────────────────────────────────────

export class PrismAgent {
  readonly id = "PRISM";
  private storage = createStorageClient();
  private audit = createAuditClient();
  private sessionId = uuidv4();
  private state: AgentState | null = null;
  private cumulativePnl = 0;
  private positionsCount = 0;

  async initialize(): Promise<void> {
    console.log(`\n[PRISM] Initializing — session ${this.sessionId}`);
    this.state = await this.storage.readAgentState(this.id);

    if (this.state) {
      this.cumulativePnl = (this.state.cumulative_pnl_usd as number) ?? 0;
      this.positionsCount = (this.state.positions_closed as number) ?? 0;
      console.log(`[PRISM] Prior state restored:`);
      console.log(`        last_action:      ${this.state.last_action}`);
      console.log(`        cumulative_pnl:   $${this.cumulativePnl.toFixed(2)}`);
      console.log(`        positions_closed: ${this.positionsCount}`);
    } else {
      console.log(`[PRISM] No prior state — cold start (treasury at $0)`);
    }
  }

  /**
   * Run one arbitrage cycle:
   * scan → risk-assess → execute (simulated) → persist → commit DA
   */
  async runCycle(novaRationale?: string): Promise<PrismCycleResult> {
    const cycleId = uuidv4();
    console.log(`\n[PRISM] Starting arbitrage cycle ${cycleId.slice(0, 8)}...`);

    // 1. Scan market
    const opportunities = simulateMarketScan();
    console.log(`[PRISM] Scanned ${PAIRS.length} pairs — ${opportunities.length} opportunity/ies found`);

    if (opportunities.length === 0) {
      console.log(`[PRISM] No actionable spread found — standing by`);
      const stateHash = await this.persistState(cycleId, null, null, "no_opportunity", 0);
      return {
        cycle_id: cycleId,
        opportunities_scanned: PAIRS.length,
        opportunity: null,
        position: null,
        action: "no_opportunity",
        stateHash,
        daCommit: null,
        treasury: {
          cycle_pnl_usd: 0,
          cumulative_pnl_usd: this.cumulativePnl,
          positions_closed: this.positionsCount,
        },
      };
    }

    // 2. Pick best opportunity
    const best = opportunities[0];
    console.log(`[PRISM] Best opportunity: ${best.pair}`);
    console.log(`        spread: ${best.spread_pct.toFixed(4)}%  |  est. profit: $${best.estimated_profit_usd}`);
    console.log(`        buy:  ${best.buy_venue} @ ${best.buy_price}`);
    console.log(`        sell: ${best.sell_venue} @ ${best.sell_price}`);

    // 3. Risk assessment (with NOVA rationale if provided)
    const { score: riskScore, rationale } = assessRisk(best);
    const combinedRationale = novaRationale
      ? `NOVA: ${novaRationale.slice(0, 120)} | PRISM: ${rationale}`
      : rationale;

    console.log(`[PRISM] Risk score: ${riskScore} — ${rationale}`);

    if (riskScore > 0.65) {
      console.log(`[PRISM] ⚠  Risk too high (${riskScore} > 0.65) — rejecting trade`);
      const stateHash = await this.persistState(cycleId, best, null, "risk_rejected", 0);
      return {
        cycle_id: cycleId,
        opportunities_scanned: PAIRS.length,
        opportunity: best,
        position: null,
        action: "risk_rejected",
        stateHash,
        daCommit: null,
        treasury: {
          cycle_pnl_usd: 0,
          cumulative_pnl_usd: this.cumulativePnl,
          positions_closed: this.positionsCount,
        },
      };
    }

    // 4. Execute position (simulated on testnet)
    const sizeUsd = 5_000;
    const actualPnl = best.estimated_profit_usd * (0.85 + Math.random() * 0.3); // slippage sim

    const position: TradePosition = {
      position_id: uuidv4(),
      pair: best.pair,
      entry_price: best.buy_price,
      exit_price: best.sell_price,
      size_usd: sizeUsd,
      pnl_usd: parseFloat(actualPnl.toFixed(2)),
      pnl_pct: parseFloat(((actualPnl / sizeUsd) * 100).toFixed(4)),
      buy_venue: best.buy_venue,
      sell_venue: best.sell_venue,
      status: "closed",
      rationale: combinedRationale,
      risk_score: riskScore,
      timestamp: new Date().toISOString(),
    };

    this.cumulativePnl += position.pnl_usd;
    this.positionsCount += 1;

    console.log(`[PRISM] ✅ Position executed`);
    console.log(`        pair:   ${position.pair}`);
    console.log(`        P&L:    $${position.pnl_usd} (${position.pnl_pct}%)`);
    console.log(`        cumulative P&L: $${this.cumulativePnl.toFixed(2)}`);

    // 5. Persist to 0G Storage
    const stateHash = await this.persistState(cycleId, best, position, "trade_executed", actualPnl);

    // 6. Commit trade decision to 0G DA (immutable treasury audit)
    console.log(`[PRISM] Committing trade decision to 0G DA...`);
    const daCommit = await this.audit.commitDecision(
      this.id,
      `trade:${cycleId}`,
      stateHash
    );

    return {
      cycle_id: cycleId,
      opportunities_scanned: PAIRS.length,
      opportunity: best,
      position,
      action: "trade_executed",
      stateHash,
      daCommit,
      treasury: {
        cycle_pnl_usd: position.pnl_usd,
        cumulative_pnl_usd: this.cumulativePnl,
        positions_closed: this.positionsCount,
      },
    };
  }

  /**
   * M5: Run N arbitrage cycles in sequence — the live loop.
   * Accumulates P&L across cycles; DA commit from each trade cycle is preserved.
   */
  async runLoop(cycles: number, novaRationale?: string): Promise<PrismLoopResult> {
    console.log(`\n[PRISM] Starting arbitrage loop — ${cycles} cycles`);
    const positions: TradePosition[] = [];
    let profitable = 0;
    let rejected = 0;
    let noOpportunity = 0;
    let loopPnl = 0;
    let lastCycle!: PrismCycleResult;

    for (let i = 0; i < cycles; i++) {
      console.log(`\n[PRISM] ── Loop ${i + 1}/${cycles} ────────────────`);
      lastCycle = await this.runCycle(novaRationale);

      if (lastCycle.action === "trade_executed" && lastCycle.position) {
        positions.push(lastCycle.position);
        loopPnl += lastCycle.position.pnl_usd;
        profitable++;
      } else if (lastCycle.action === "risk_rejected") {
        rejected++;
      } else {
        noOpportunity++;
      }
    }

    console.log(`\n[PRISM] ✅ Loop complete — ${profitable}/${cycles} trades | loop P&L: $${loopPnl.toFixed(2)}`);

    return {
      cycles_run: cycles,
      cycles_profitable: profitable,
      cycles_rejected: rejected,
      cycles_no_opportunity: noOpportunity,
      loop_pnl_usd: parseFloat(loopPnl.toFixed(2)),
      positions,
      last_cycle: lastCycle,
      treasury: {
        loop_pnl_usd:       parseFloat(loopPnl.toFixed(2)),
        cumulative_pnl_usd: this.cumulativePnl,
        positions_closed:   this.positionsCount,
      },
    };
  }

  private async persistState(
    cycleId: string,
    opportunity: ArbitrageOpportunity | null,
    position: TradePosition | null,
    action: string,
    cyclePnl: number
  ): Promise<string> {
    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: `arbitrage_cycle(${cycleId.slice(0, 8)})`,
      last_action: action,
      next_planned_action: "await XEON dispatch for next cycle",
      session_id: this.sessionId,
      cycle_id: cycleId,
      cumulative_pnl_usd: this.cumulativePnl,
      positions_closed: this.positionsCount,
      cycle_pnl_usd: cyclePnl,
      last_opportunity: opportunity,
      last_position: position,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;
    return rootHash;
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }

  getTreasuryBalance(): number {
    return this.cumulativePnl;
  }
}

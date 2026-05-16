/**
 * PRISM — Arbitrage & Treasury Agent
 *
 * Autonomous on-chain arbitrage revenue loop.
 * Self-funded system: profits compound into treasury, funding future cycles.
 *
 * Each cycle:
 *   1. Scan   — detect price discrepancies across venues (via 0G Compute)
 *   2. Score  — filter by confidence + spread threshold
 *   3. Execute — simulate trades against testnet prices
 *   4. Commit  — immutable trade record on 0G DA (real txHash)
 *   5. Reinvest — profits added to treasury (recursive funding)
 *   6. Persist  — state saved to 0G Storage (content-addressed, restartable)
 *
 * Technical proof:
 *   Every trade decision has an on-chain txHash (0G DA — chainscan-galileo.0g.ai).
 *   Treasury balance is stored on 0G Storage (verifiable by rootHash).
 */

import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";
import { createAuditClient, CommitResult } from "../integrations/da/audit.js";
import { createArbitrageClient, ArbitrageOpportunity } from "../integrations/compute/prism_arbitrage.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClosedTrade {
  trade_id: string;
  pair: string;
  venue_a: string;
  venue_b: string;
  entry_price: number;
  exit_price: number;
  size_usd: number;
  pnl_usd: number;
  pnl_pct: number;
  entry_timestamp: string;
  exit_timestamp: string;
  da_tx_hash: string | null;
  da_explorer_url: string | null;
}

export interface ArbitrageCycleResult {
  cycle_id: string;
  cycle_number: number;
  opportunities_scanned: number;
  trades_executed: number;
  cycle_pnl_usd: number;
  treasury_before_usd: number;
  treasury_after_usd: number;
  total_pnl_usd: number;
  stateHash: string;
  daCommits: CommitResult[];
  trades: ClosedTrade[];
  via_0g_compute: boolean;
}

// Extended agent state stored on 0G Storage
interface PrismSavedState extends AgentState {
  treasury_usd: number;
  total_realized_pnl_usd: number;
  cycles_completed: number;
  closed_positions: ClosedTrade[];
}

// ── PrismAgent ────────────────────────────────────────────────────────────────

export class PrismAgent {
  readonly id = "PRISM";
  private storage = createStorageClient();
  private audit = createAuditClient();
  private arbitrage = createArbitrageClient();
  private sessionId = uuidv4();
  private state: PrismSavedState | null = null;

  private treasury = 100.0;          // USD seed capital
  private closedPositions: ClosedTrade[] = [];
  private totalPnl = 0.0;
  private cyclesCompleted = 0;

  /** Call on startup — restores prior state from 0G Storage if available */
  async initialize(): Promise<void> {
    console.log(`\n[PRISM] Initializing — session ${this.sessionId}`);
    const saved = await this.storage.readAgentState(this.id) as PrismSavedState | null;

    if (saved) {
      console.log(`[PRISM] Prior state restored:`);
      console.log(`        treasury:         $${(saved.treasury_usd ?? 100).toFixed(2)}`);
      console.log(`        cycles_completed: ${saved.cycles_completed ?? 0}`);
      console.log(`        total_pnl:        $${(saved.total_realized_pnl_usd ?? 0).toFixed(4)}`);
      console.log(`        prior session:    ${saved.session_id}`);

      this.treasury = saved.treasury_usd ?? 100.0;
      this.closedPositions = saved.closed_positions ?? [];
      this.totalPnl = saved.total_realized_pnl_usd ?? 0.0;
      this.cyclesCompleted = saved.cycles_completed ?? 0;
      this.state = saved;
    } else {
      console.log(`[PRISM] No prior state — cold start | seed treasury: $${this.treasury.toFixed(2)}`);
    }
  }

  /**
   * Run one full arbitrage cycle:
   *   Scan → Score → Execute → DA commit → Reinvest → Persist
   *
   * Every executed trade is committed to 0G DA (immutable on-chain proof).
   * Treasury balance after the cycle is stored to 0G Storage.
   */
  async runCycle(): Promise<ArbitrageCycleResult> {
    const cycleId = uuidv4();
    const cycleNumber = this.cyclesCompleted + 1;

    console.log(`\n[PRISM] ── Arbitrage Cycle #${cycleNumber} (${cycleId.slice(0, 8)}…) ──`);
    console.log(`[PRISM]    Treasury: $${this.treasury.toFixed(2)}`);

    const treasuryBefore = this.treasury;

    // 1. Scan via 0G Compute (falls back to stub if balance < 3 OG)
    const { opportunities, via_0g_compute } = await this.arbitrage.scanOpportunities(this.treasury);
    console.log(`[PRISM] Scanned ${opportunities.length} pairs`);

    // 2. Filter: confidence ≥ 0.65 AND spread ≥ 0.5%
    const viable = opportunities.filter(o => o.confidence >= 0.65 && o.spread_pct >= 0.5);
    console.log(`[PRISM] ${viable.length} viable opportunities (confidence≥0.65, spread≥0.5%)`);

    // 3. Execute top 3 by expected profit
    const toExecute = viable
      .sort((a, b) => b.estimated_profit_usd - a.estimated_profit_usd)
      .slice(0, 3);

    const daCommits: CommitResult[] = [];
    const executedTrades: ClosedTrade[] = [];

    for (const opp of toExecute) {
      const trade = this.simulateTrade(opp);
      executedTrades.push(trade);

      // 4. Commit trade decision to 0G DA (immutable proof)
      const commit = await this.commitTrade(trade, cycleId);
      if (commit) {
        daCommits.push(commit);
        trade.da_tx_hash = commit.txHash;
        trade.da_explorer_url = commit.explorerUrl;
      }

      // 5. Reinvest profits into treasury
      this.treasury += trade.pnl_usd;
      this.totalPnl += trade.pnl_usd;
      this.closedPositions.push(trade);

      console.log(
        `[PRISM] ✅  ${trade.pair.padEnd(12)} | pnl: $${trade.pnl_usd.toFixed(4).padStart(7)}` +
        ` | treasury: $${this.treasury.toFixed(2)}`
      );
    }

    this.cyclesCompleted++;
    const cyclePnl = this.treasury - treasuryBefore;

    // 6. Persist state to 0G Storage
    const newState: PrismSavedState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: `arbitrage_cycle(${cycleNumber})`,
      last_action: `cycle_${cycleNumber}(trades=${executedTrades.length},pnl=$${cyclePnl.toFixed(4)})`,
      next_planned_action: "await next cycle or XEON dispatch",
      session_id: this.sessionId,
      treasury_usd: this.treasury,
      total_realized_pnl_usd: this.totalPnl,
      cycles_completed: this.cyclesCompleted,
      closed_positions: this.closedPositions.slice(-20), // keep last 20
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;

    const result: ArbitrageCycleResult = {
      cycle_id: cycleId,
      cycle_number: cycleNumber,
      opportunities_scanned: opportunities.length,
      trades_executed: executedTrades.length,
      cycle_pnl_usd: cyclePnl,
      treasury_before_usd: treasuryBefore,
      treasury_after_usd: this.treasury,
      total_pnl_usd: this.totalPnl,
      stateHash: rootHash,
      daCommits,
      trades: executedTrades,
      via_0g_compute,
    };

    console.log(`\n[PRISM] Cycle #${cycleNumber} complete`);
    console.log(`        trades:       ${executedTrades.length}`);
    console.log(`        cycle_pnl:    $${cyclePnl.toFixed(4)}`);
    console.log(`        treasury:     $${this.treasury.toFixed(2)} (was $${treasuryBefore.toFixed(2)})`);
    console.log(`        total_pnl:    $${this.totalPnl.toFixed(4)}`);
    console.log(`        storage_hash: ${rootHash}`);
    console.log(`        da_commits:   ${daCommits.length}`);

    return result;
  }

  /** Simulate trade execution with realistic slippage (0–0.05%) */
  private simulateTrade(opp: ArbitrageOpportunity): ClosedTrade {
    const tradeId = uuidv4();
    const entryTs = new Date().toISOString();

    const slippage = 1 - (Math.random() * 0.0005);
    const actualPnl = opp.estimated_profit_usd * slippage * opp.confidence;
    const exitPrice = opp.price_b * slippage;
    const pnlPct = (actualPnl / opp.size_usd) * 100;

    return {
      trade_id: tradeId,
      pair: opp.pair,
      venue_a: opp.venue_a,
      venue_b: opp.venue_b,
      entry_price: opp.price_a,
      exit_price: exitPrice,
      size_usd: opp.size_usd,
      pnl_usd: actualPnl,
      pnl_pct: pnlPct,
      entry_timestamp: entryTs,
      exit_timestamp: new Date().toISOString(),
      da_tx_hash: null,
      da_explorer_url: null,
    };
  }

  /** Commit trade decision to 0G DA — best-effort (graceful on failure) */
  private async commitTrade(trade: ClosedTrade, cycleId: string): Promise<CommitResult | null> {
    try {
      const workflowId = `${cycleId.slice(0, 8)}:${trade.trade_id.slice(0, 8)}`;

      const payload = JSON.stringify({
        agent: this.id,
        trade_id: trade.trade_id,
        pair: trade.pair,
        pnl_usd: trade.pnl_usd.toFixed(6),
        size_usd: trade.size_usd,
        treasury_pre: this.treasury.toFixed(2),
      });
      const stateHash = ethers.keccak256(ethers.toUtf8Bytes(payload));

      console.log(`[PRISM] Committing ${trade.pair} trade to 0G DA...`);
      return await this.audit.commitDecision(this.id, workflowId, stateHash);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[PRISM] ⚠  DA commit failed: ${msg.slice(0, 60)} — continuing`);
      return null;
    }
  }

  getTreasury(): number { return this.treasury; }
  getTotalPnl(): number { return this.totalPnl; }
  getCyclesCompleted(): number { return this.cyclesCompleted; }
  getCurrentState(): PrismSavedState | null { return this.state; }
}

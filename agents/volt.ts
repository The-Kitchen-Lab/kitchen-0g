/**
 * VOLT — DeFi & Treasury Operations Agent
 *
 * Manages yield optimization, DeFi protocol interactions, and Kitchen treasury.
 * Works alongside PRISM: PRISM handles arbitrage, VOLT handles yield farming.
 *
 * State is persisted to 0G Storage after each yield cycle.
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";

export interface VoltYieldRequest {
  portfolio: Record<string, number>; // token → USD amount
}

export interface VoltYieldResult {
  cycle_id: string;
  protocol_allocations: ProtocolAllocation[];
  projected_apy: number;
  rebalance_actions: string[];
  treasury_snapshot: TreasurySnapshot;
  stateHash: string;
}

export interface ProtocolAllocation {
  protocol: string;
  token: string;
  amount_usd: number;
  apy_pct: number;
}

export interface TreasurySnapshot {
  total_usd: number;
  yield_bearing_usd: number;
  idle_usd: number;
  projected_monthly_yield_usd: number;
}

const PROTOCOLS = [
  { name: "0G-Vault",    apy: 8.4  },
  { name: "Uniswap-V3", apy: 6.2  },
  { name: "Curve-3pool", apy: 4.8  },
];

export class VoltAgent {
  readonly id = "VOLT";
  private storage = createStorageClient();
  private sessionId = uuidv4();
  private state: AgentState | null = null;
  private totalYieldEarned = 0;

  async initialize(): Promise<void> {
    console.log(`\n[VOLT] Initializing — session ${this.sessionId}`);
    this.state = await this.storage.readAgentState(this.id);
    if (this.state) {
      this.totalYieldEarned = (this.state.total_yield_earned_usd as number) ?? 0;
      console.log(`[VOLT] Prior state restored — total_yield_earned: $${this.totalYieldEarned.toFixed(2)}`);
    } else {
      console.log(`[VOLT] No prior state — cold start`);
    }
  }

  async optimizeYield(req: VoltYieldRequest): Promise<VoltYieldResult> {
    const cycleId = uuidv4();
    const totalPortfolio = Object.values(req.portfolio).reduce((s, v) => s + v, 0);
    console.log(`\n[VOLT] Optimizing yield for $${totalPortfolio.toFixed(2)} portfolio`);
    await new Promise(r => setTimeout(r, 150));

    // Allocate across protocols proportionally
    const allocations: ProtocolAllocation[] = PROTOCOLS.map((p, i) => {
      const share = i === 0 ? 0.5 : i === 1 ? 0.3 : 0.2;
      const token = Object.keys(req.portfolio)[i % Object.keys(req.portfolio).length] ?? "USDC";
      return {
        protocol:   p.name,
        token,
        amount_usd: parseFloat((totalPortfolio * share).toFixed(2)),
        apy_pct:    p.apy + (Math.random() - 0.5) * 0.4,
      };
    });

    const weightedApy = allocations.reduce((s, a) => s + (a.apy_pct * a.amount_usd), 0) / totalPortfolio;
    const monthlyYield = (totalPortfolio * weightedApy) / 100 / 12;

    const rebalance_actions = [
      `Move 50% to ${PROTOCOLS[0].name} (highest APY: ${PROTOCOLS[0].apy}%)`,
      "Compound earned yield weekly",
      "Set slippage guard: 0.5% max",
    ];

    const treasury: TreasurySnapshot = {
      total_usd: totalPortfolio,
      yield_bearing_usd: parseFloat((totalPortfolio * 0.85).toFixed(2)),
      idle_usd: parseFloat((totalPortfolio * 0.15).toFixed(2)),
      projected_monthly_yield_usd: parseFloat(monthlyYield.toFixed(2)),
    };

    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: `yield_optimization(${cycleId.slice(0, 8)})`,
      last_action: `optimize_yield(portfolio=$${totalPortfolio.toFixed(2)})`,
      next_planned_action: "compound yield, rebalance next cycle",
      session_id: this.sessionId,
      cycle_id: cycleId,
      total_portfolio_usd: totalPortfolio,
      projected_apy: parseFloat(weightedApy.toFixed(3)),
      total_yield_earned_usd: this.totalYieldEarned,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;
    console.log(`[VOLT] ✅ Yield optimized (APY ~${weightedApy.toFixed(2)}%, ~$${monthlyYield.toFixed(2)}/mo) — stateHash: ${rootHash}`);

    return {
      cycle_id: cycleId,
      protocol_allocations: allocations,
      projected_apy: parseFloat(weightedApy.toFixed(3)),
      rebalance_actions,
      treasury_snapshot: treasury,
      stateHash: rootHash,
    };
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }
}

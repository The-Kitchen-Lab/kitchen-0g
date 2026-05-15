/**
 * APEX — Strategy & Growth Agent
 *
 * Defines GTM strategy, growth experiments, and market positioning for Kitchen products.
 * State is persisted to 0G Storage after each strategy cycle.
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";

export interface ApexStrategyRequest {
  productName: string;
  market_analysis: string;
  treasury_balance_usd: number;
}

export interface ApexStrategyResult {
  strategy_id: string;
  gtm_phase: string;
  growth_experiments: string[];
  budget_allocation: Record<string, number>;
  target_markets: string[];
  stateHash: string;
}

export class ApexAgent {
  readonly id = "APEX";
  private storage = createStorageClient();
  private sessionId = uuidv4();
  private state: AgentState | null = null;

  async initialize(): Promise<void> {
    console.log(`\n[APEX] Initializing — session ${this.sessionId}`);
    this.state = await this.storage.readAgentState(this.id);
    if (this.state) {
      console.log(`[APEX] Prior state restored — last_action: ${this.state.last_action}`);
    } else {
      console.log(`[APEX] No prior state — cold start`);
    }
  }

  async planGrowthStrategy(req: ApexStrategyRequest): Promise<ApexStrategyResult> {
    const strategyId = uuidv4();
    console.log(`\n[APEX] Planning growth strategy for: ${req.productName}`);
    await new Promise(r => setTimeout(r, 150));

    const growthExperiments = [
      "Developer community seeding (crypto Twitter, Farcaster)",
      "Open-source the agent architecture — 0G ecosystem showcase",
      "Hackathon integration bounties ($1K USDC pool)",
      "Integration partnerships: 0G native dApps",
    ];

    const budgetAllocation: Record<string, number> = {
      community:     Math.round(req.treasury_balance_usd * 0.35),
      dev_relations: Math.round(req.treasury_balance_usd * 0.25),
      partnerships:  Math.round(req.treasury_balance_usd * 0.20),
      content:       Math.round(req.treasury_balance_usd * 0.15),
      reserve:       Math.round(req.treasury_balance_usd * 0.05),
    };

    const targetMarkets = [
      "DeFi developers building on 0G",
      "Autonomous agent builders",
      "On-chain product studios",
      "Web3 infrastructure teams",
    ];

    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: `growth_strategy(${req.productName})`,
      last_action: `plan_growth_strategy(${req.productName})`,
      next_planned_action: "execute experiment phase 1, report to XEON",
      session_id: this.sessionId,
      strategy_id: strategyId,
      product: req.productName,
      experiment_count: growthExperiments.length,
      total_budget_usd: req.treasury_balance_usd,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;
    console.log(`[APEX] ✅ Strategy planned (${growthExperiments.length} experiments) — stateHash: ${rootHash}`);

    return {
      strategy_id: strategyId,
      gtm_phase: "Phase 1: Developer Awareness",
      growth_experiments: growthExperiments,
      budget_allocation: budgetAllocation,
      target_markets: targetMarkets,
      stateHash: rootHash,
    };
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }
}

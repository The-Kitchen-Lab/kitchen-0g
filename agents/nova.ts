/**
 * NOVA — AI/ML Lead
 *
 * Handles market analysis and inference tasks.
 * Inference is routed through 0G Compute Network (Phase 3).
 * Falls back to stub if ledger balance < 3 OG.
 *
 * State is persisted to 0G Storage after each inference run (Phase 2).
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";
import { createComputeClient } from "../integrations/compute/nova_inference.js";

export interface NovaInferenceRequest {
  prompt: string;
  model?: string;
  context?: string;
}

export interface NovaInferenceResult {
  completion: string;
  model: string;
  compute_job_id: string | null;
  via_0g_compute: boolean;
  stateHash: string;
}

export class NovaAgent {
  readonly id = "NOVA";
  private storage = createStorageClient();
  private compute = createComputeClient();
  private sessionId = uuidv4();
  private state: AgentState | null = null;

  /** Call on startup — restores prior state from 0G Storage if available */
  async initialize(): Promise<void> {
    console.log(`\n[NOVA] Initializing — session ${this.sessionId}`);
    this.state = await this.storage.readAgentState(this.id);

    if (this.state) {
      console.log(`[NOVA] Prior state restored:`);
      console.log(`       last_action:  ${this.state.last_action}`);
      console.log(`       prior session: ${this.state.session_id}`);
    } else {
      console.log(`[NOVA] No prior state — cold start`);
    }
  }

  /**
   * Run market analysis inference via 0G Compute.
   * Automatically falls back to stub when ledger balance is insufficient.
   */
  async runInference(req: NovaInferenceRequest): Promise<NovaInferenceResult> {
    console.log(`\n[NOVA] Running inference`);
    console.log(`[NOVA] Prompt: ${req.prompt.slice(0, 80)}...`);

    const result = await this.compute.runInference({
      prompt: req.prompt,
      systemPrompt: "You are NOVA, the AI/ML Lead in The Kitchen autonomous agent lab. Analyze market fit with precision. Be concise.",
      model: req.model,
      maxTokens: 600,
    });

    if (result.via_0g_compute) {
      console.log(`[NOVA] ✅ 0G Compute inference done`);
      console.log(`[NOVA]    job_id:   ${result.compute_job_id}`);
      console.log(`[NOVA]    provider: ${result.provider_address}`);
    } else {
      console.log(`[NOVA] ⚡ Stub inference done (fund 3 OG to activate 0G Compute)`);
    }

    // Persist state to 0G Storage
    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: req.prompt.slice(0, 200),
      last_action: `inference(${result.model}, via_0g=${result.via_0g_compute})`,
      next_planned_action: "await XEON dispatch for next task",
      session_id: this.sessionId,
      completion: result.completion.slice(0, 500),
      compute_job_id: result.compute_job_id,
      via_0g_compute: result.via_0g_compute,
      provider_address: result.provider_address,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;

    return {
      completion: result.completion,
      model: result.model,
      compute_job_id: result.compute_job_id,
      via_0g_compute: result.via_0g_compute,
      stateHash: rootHash,
    };
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }
}

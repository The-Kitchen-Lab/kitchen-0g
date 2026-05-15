/**
 * NOVA — AI/ML Lead
 *
 * Handles market analysis and inference tasks.
 * Inference runs exclusively via 0G Compute Network — no stub fallback.
 * Model: qwen/qwen-2.5-7b-instruct (decentralized provider discovery).
 *
 * State is persisted to 0G Storage after each inference run.
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";
import { createComputeClient } from "../integrations/compute/nova_inference.js";

const NOVA_MODEL = "qwen/qwen-2.5-7b-instruct";

export interface NovaInferenceRequest {
  prompt: string;
  model?: string;
  context?: string;
}

export interface NovaInferenceResult {
  completion: string;
  model: string;
  compute_job_id: string;
  provider_address: string;
  via_0g_compute: true;
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
      console.log(`       last_action:   ${this.state.last_action}`);
      console.log(`       prior session: ${this.state.session_id}`);
    } else {
      console.log(`[NOVA] No prior state — cold start`);
    }
  }

  /**
   * Run market analysis inference via 0G Compute.
   * Uses qwen-2.5-7b-instruct with decentralized provider discovery.
   * Throws if wallet balance < 3 OG or no providers available.
   */
  async runInference(req: NovaInferenceRequest): Promise<NovaInferenceResult> {
    const model = req.model ?? NOVA_MODEL;
    console.log(`\n[NOVA] Running inference via 0G Compute`);
    console.log(`[NOVA] Model:  ${model}`);
    console.log(`[NOVA] Prompt: ${req.prompt.slice(0, 80)}...`);

    const result = await this.compute.runInference({
      prompt: req.prompt,
      systemPrompt: "You are NOVA, the AI/ML Lead in The Kitchen autonomous agent lab. Analyze market fit with precision. Be concise.",
      model,
      maxTokens: 600,
    });

    console.log(`[NOVA] ✅ 0G Compute inference done`);
    console.log(`[NOVA]    model:    ${result.model}`);
    console.log(`[NOVA]    job_id:   ${result.compute_job_id}`);
    console.log(`[NOVA]    provider: ${result.provider_address}`);

    // Persist state to 0G Storage
    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: req.prompt.slice(0, 200),
      last_action: `inference(${result.model}, provider=${result.provider_address.slice(0, 10)}...)`,
      next_planned_action: "await XEON dispatch for next task",
      session_id: this.sessionId,
      completion: result.completion.slice(0, 500),
      compute_job_id: result.compute_job_id,
      via_0g_compute: true,
      provider_address: result.provider_address,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;

    return {
      completion: result.completion,
      model: result.model,
      compute_job_id: result.compute_job_id,
      provider_address: result.provider_address,
      via_0g_compute: true,
      stateHash: rootHash,
    };
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }
}

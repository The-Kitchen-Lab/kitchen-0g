/**
 * FLUX — Data Flow & Integration Agent
 *
 * Manages inter-agent data pipelines, ETL transformations, and API integrations.
 * State is persisted to 0G Storage after each pipeline run.
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";

export interface FluxPipelineRequest {
  source_agent: string;
  target_agent: string;
  payload: Record<string, unknown>;
}

export interface FluxPipelineResult {
  pipeline_id: string;
  records_processed: number;
  transformations: string[];
  routing_table: Record<string, string>;
  stateHash: string;
}

export class FluxAgent {
  readonly id = "FLUX";
  private storage = createStorageClient();
  private sessionId = uuidv4();
  private state: AgentState | null = null;

  async initialize(): Promise<void> {
    console.log(`\n[FLUX] Initializing — session ${this.sessionId}`);
    this.state = await this.storage.readAgentState(this.id);
    if (this.state) {
      console.log(`[FLUX] Prior state restored — last_action: ${this.state.last_action}`);
    } else {
      console.log(`[FLUX] No prior state — cold start`);
    }
  }

  async processFlow(req: FluxPipelineRequest): Promise<FluxPipelineResult> {
    const pipelineId = uuidv4();
    console.log(`\n[FLUX] Processing pipeline ${pipelineId.slice(0, 8)}: ${req.source_agent} → ${req.target_agent}`);
    await new Promise(r => setTimeout(r, 150));

    const transformations = [
      `normalize(${req.source_agent}.output)`,
      `validate_schema(target=${req.target_agent})`,
      `serialize_to_0g_format`,
      `append_pipeline_id(${pipelineId.slice(0, 8)})`,
    ];

    const routing_table: Record<string, string> = {
      NOVA:  "market_analysis → EMBR, PRISM, ARC",
      EMBR:  "content_draft → ECHO",
      PRISM: "trade_result → VOLT, IRIS",
      ARC:   "infra_spec → FLUX",
      FLUX:  "pipeline_result → IRIS",
      ECHO:  "published_content → IRIS",
      IRIS:  "metrics → APEX",
      APEX:  "strategy → XEON",
      VOLT:  "yield_report → PRISM",
      SAGE:  "research → NOVA, APEX",
    };

    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: `pipeline(${req.source_agent}→${req.target_agent})`,
      last_action: `process_flow(${req.source_agent}→${req.target_agent})`,
      next_planned_action: "await next inter-agent data event",
      session_id: this.sessionId,
      pipeline_id: pipelineId,
      records_processed: Object.keys(req.payload).length,
      active_routes: Object.keys(routing_table).length,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;
    console.log(`[FLUX] ✅ Pipeline processed — stateHash: ${rootHash}`);

    return {
      pipeline_id: pipelineId,
      records_processed: Object.keys(req.payload).length,
      transformations,
      routing_table,
      stateHash: rootHash,
    };
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }
}

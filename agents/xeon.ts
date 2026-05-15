/**
 * XEON — Chief Technology Officer
 *
 * Orchestrates the Kitchen agent fleet. On every task cycle:
 *   1. Reads prior state from 0G Storage (restart recovery)
 *   2. Executes the task (dispatch, approve, coordinate)
 *   3. Writes updated state to 0G Storage
 *   4. Commits decision to 0G DA (immutable audit trail)
 *   5. Routes dispatch_task calls through OpenClaw Skills (Track 1)
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";
import { createAuditClient, CommitResult, VerifyResult, AuditClient } from "../integrations/da/audit.js";
import {
  createOpenClawDispatchClient,
  OpenClawDispatchResult,
} from "../integrations/openclaw/dispatch.js";

export interface XeonTask {
  type: "approve_product" | "dispatch_task" | "coordinate";
  payload: Record<string, unknown>;
}

export interface XeonResult {
  status: "completed" | "deferred";
  output: Record<string, unknown>;
  stateHash: string;
  daCommit: CommitResult;   // every XEON decision is committed to DA (M4)
  openclawDispatch: OpenClawDispatchResult | null;
}

export class XeonAgent {
  readonly id = "XEON";
  private storage = createStorageClient();
  private audit = createAuditClient();
  private openclaw = createOpenClawDispatchClient();
  private sessionId = uuidv4();
  private state: AgentState | null = null;

  /** Call on startup — restores prior state from 0G Storage if available */
  async initialize(): Promise<void> {
    console.log(`\n[XEON] Initializing — session ${this.sessionId}`);
    this.state = await this.storage.readAgentState(this.id);

    if (this.state) {
      console.log(`[XEON] Prior state restored:`);
      console.log(`       last_action:          ${this.state.last_action}`);
      console.log(`       next_planned_action:  ${this.state.next_planned_action}`);
      console.log(`       prior session:        ${this.state.session_id}`);
    } else {
      console.log(`[XEON] No prior state — cold start`);
    }
  }

  /** Execute a task, persist state to 0G Storage, commit decision to 0G DA */
  async executeTask(task: XeonTask): Promise<XeonResult> {
    const taskDesc = `${task.type}(${JSON.stringify(task.payload).slice(0, 60)})`;
    const workflowId = uuidv4();
    console.log(`\n[XEON] Executing task: ${taskDesc}`);

    const output = await this.processTask(task, workflowId);

    const nextAction = task.type === "approve_product"
      ? "dispatch_task to NOVA for market analysis"
      : task.type === "dispatch_task"
        ? "await NOVA result, then dispatch EMBR for content"
        : "await sub-agent completions";

    // 1. Persist state to 0G Storage
    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: taskDesc,
      last_action: taskDesc,
      next_planned_action: nextAction,
      session_id: this.sessionId,
      workflow_id: workflowId,
      output,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;
    console.log(`[XEON] Storage committed — rootHash: ${rootHash}`);

    // 2. Route dispatch_task through OpenClaw Skills (Track 1)
    let openclawDispatch: OpenClawDispatchResult | null = null;
    if (task.type === "dispatch_task") {
      const target = (task.payload.target as string | undefined) ?? "NOVA";
      openclawDispatch = await this.openclaw.dispatch({
        from_agent:        this.id,
        target,
        task_type:         (task.payload.task as string | undefined) ?? "task",
        payload:           task.payload,
        source_state_hash: rootHash,
        workflow_id:       workflowId,
      });

      if (openclawDispatch.via_gateway) {
        console.log(`[XEON] OpenClaw dispatch accepted — id: ${openclawDispatch.dispatch_id}`);
      } else {
        console.log(`[XEON] OpenClaw dispatch logged (gateway offline) — workflow: ${workflowId}`);
      }
    }

    // 3. Commit every XEON decision to 0G DA — full audit trail (M4)
    const daCommit = await this.audit.commitDecision(this.id, workflowId, rootHash);

    return { status: "completed", output, stateHash: rootHash, daCommit, openclawDispatch };
  }

  private async processTask(
    task: XeonTask,
    workflowId: string,
  ): Promise<Record<string, unknown>> {
    await new Promise(r => setTimeout(r, 200));

    switch (task.type) {
      case "approve_product":
        return {
          approved: true,
          product: task.payload.name,
          verdict: "Market fit signal positive — routing to NOVA for deep analysis",
        };
      case "dispatch_task": {
        const target = (task.payload.target as string | undefined) ?? "NOVA";
        return {
          dispatched_to:      target,
          task_id:            uuidv4(),
          workflow_id:        workflowId,
          priority:           "high",
          via_openclaw_skill: true,    // signals that dispatch goes through OpenClaw
        };
      }
      case "coordinate":
        return {
          agents_active: ["NOVA", "EMBR", "MTRK"],
          status: "all systems operational",
        };
    }
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }

  /** Verify an existing DA commitment by txHash */
  async verifyDaCommit(txHash: string): Promise<VerifyResult> {
    return this.audit.verifyCommit(txHash);
  }

  getAuditClient(): AuditClient {
    return this.audit;
  }
}

/**
 * XEON — Chief Technology Officer
 *
 * Orchestrates the Kitchen agent fleet. On every task cycle:
 *   1. Reads prior state from 0G Storage (restart recovery)
 *   2. Executes the task (dispatch, approve, coordinate)
 *   3. Writes updated state to 0G Storage
 *   4. Commits decision to 0G DA (Phase 4)
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";

export interface XeonTask {
  type: "approve_product" | "dispatch_task" | "coordinate";
  payload: Record<string, unknown>;
}

export interface XeonResult {
  status: "completed" | "deferred";
  output: Record<string, unknown>;
  stateHash: string;
}

export class XeonAgent {
  readonly id = "XEON";
  private storage = createStorageClient();
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

  /** Execute a task, persist state to 0G Storage after completion */
  async executeTask(task: XeonTask): Promise<XeonResult> {
    const taskDesc = `${task.type}(${JSON.stringify(task.payload).slice(0, 60)})`;
    console.log(`\n[XEON] Executing task: ${taskDesc}`);

    // Simulate task processing
    const output = await this.processTask(task);

    // Build next planned action hint
    const nextAction = task.type === "approve_product"
      ? "dispatch_task to NOVA for market analysis"
      : task.type === "dispatch_task"
        ? "await NOVA result, then dispatch EMBR for content"
        : "await sub-agent completions";

    // Persist state to 0G Storage
    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: taskDesc,
      last_action: taskDesc,
      next_planned_action: nextAction,
      session_id: this.sessionId,
      output,
    };

    const { rootHash, txHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;

    console.log(`[XEON] State committed — rootHash: ${rootHash}`);

    return { status: "completed", output, stateHash: rootHash };
  }

  private async processTask(task: XeonTask): Promise<Record<string, unknown>> {
    // Simulate real work with a short delay
    await new Promise(r => setTimeout(r, 200));

    switch (task.type) {
      case "approve_product":
        return {
          approved: true,
          product: task.payload.name,
          verdict: "Market fit signal positive — routing to NOVA for deep analysis",
        };
      case "dispatch_task":
        return {
          dispatched_to: task.payload.target ?? "NOVA",
          task_id: uuidv4(),
          priority: "high",
        };
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
}

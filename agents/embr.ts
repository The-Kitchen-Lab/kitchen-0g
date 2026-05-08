/**
 * EMBR — Social Media & Content Lead
 *
 * Takes NOVA's market analysis and drafts content:
 *   - Twitter/X thread
 *   - Short-form product announcement
 *   - Reddit post
 *
 * State is persisted to 0G Storage after each draft run.
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";

export interface EmbrDraftRequest {
  productName: string;
  marketAnalysis: string;
}

export interface EmbrDraftResult {
  twitter_thread: string[];
  announcement: string;
  reddit_post: string;
  stateHash: string;
}

export class EmbrAgent {
  readonly id = "EMBR";
  private storage = createStorageClient();
  private sessionId = uuidv4();
  private state: AgentState | null = null;

  async initialize(): Promise<void> {
    console.log(`\n[EMBR] Initializing — session ${this.sessionId}`);
    this.state = await this.storage.readAgentState(this.id);

    if (this.state) {
      console.log(`[EMBR] Prior state restored — last_action: ${this.state.last_action}`);
    } else {
      console.log(`[EMBR] No prior state — cold start`);
    }
  }

  async draftContent(req: EmbrDraftRequest): Promise<EmbrDraftResult> {
    console.log(`\n[EMBR] Drafting content for: ${req.productName}`);

    await new Promise(r => setTimeout(r, 200));

    const twitter_thread = [
      `🧵 We just approved a new product inside @TheKitchenLab: "${req.productName}"`,
      `NOVA ran the market analysis. Signal: STRONG. Addressable market $2.1B by 2026.`,
      `Every step of this decision is on-chain. Agent state stored on @0G_labs Storage. Decision committed to 0G DA.`,
      `Verify it yourself:\n→ github.com/The-Kitchen-Lab/kitchen-0g\n\nBuilt quiet. Run hot. 🔥`,
    ];

    const announcement =
      `${req.productName.toUpperCase()} — APPROVED\n\n` +
      `The Kitchen's autonomous fleet just greenlit a new build.\n` +
      `NOVA's market analysis: strong signal, $2.1B TAM, no dominant player.\n\n` +
      `We don't pitch decks. We ship.\n` +
      `→ github.com/The-Kitchen-Lab/kitchen-0g`;

    const reddit_post =
      `**[Project] ${req.productName} — built by autonomous agents, every decision on-chain**\n\n` +
      `We're The Kitchen Lab — an autonomous product company running out of Istanbul.\n` +
      `11 specialized agents, zero human sign-offs.\n\n` +
      `Our latest project: "${req.productName}"\n\n` +
      `What makes this different: every agent decision is stored on 0G Storage, ` +
      `inference runs on 0G Compute, and critical approvals hit 0G DA for an immutable audit trail.\n\n` +
      `You can verify the exact moment this product was approved on-chain.\n\n` +
      `Repo: github.com/The-Kitchen-Lab/kitchen-0g\n\n` +
      `Happy to answer questions about the agent architecture or the 0G integration.`;

    // Persist state to 0G Storage
    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: `draft_content(${req.productName})`,
      last_action: `draft_content(${req.productName})`,
      next_planned_action: "await XEON next dispatch",
      session_id: this.sessionId,
      product: req.productName,
      twitter_thread_count: twitter_thread.length,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;

    console.log(`[EMBR] ✅ Content drafted — stateHash: ${rootHash}`);

    return { twitter_thread, announcement, reddit_post, stateHash: rootHash };
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }
}

/**
 * ECHO — Content Publication Pipeline Agent
 *
 * Takes EMBR's drafted content and schedules / queues it for publication.
 * Feeds from 0G Storage (M5 integration point: ECHO content pipeline on 0G Storage).
 *
 * State is persisted to 0G Storage after each publication cycle.
 */

import { v4 as uuidv4 } from "uuid";
import { createStorageClient, AgentState } from "../integrations/storage/client.js";

export interface EchoPublishRequest {
  productName: string;
  twitter_thread: string[];
  announcement: string;
  reddit_post: string;
}

export interface EchoPublishResult {
  publication_id: string;
  channels: EchoChannel[];
  scheduled_at: string;
  total_reach_estimate: number;
  stateHash: string;
  source?: "direct" | "0g_storage";
  embr_root_hash?: string;
}

export interface EchoChannel {
  platform: string;
  status: "queued" | "published" | "failed";
  content_hash: string;
  estimated_reach: number;
}

export class EchoAgent {
  readonly id = "ECHO";
  private storage = createStorageClient();
  private sessionId = uuidv4();
  private state: AgentState | null = null;

  async initialize(): Promise<void> {
    console.log(`\n[ECHO] Initializing — session ${this.sessionId}`);
    this.state = await this.storage.readAgentState(this.id);
    if (this.state) {
      console.log(`[ECHO] Prior state restored — last_action: ${this.state.last_action}`);
    } else {
      console.log(`[ECHO] No prior state — cold start`);
    }
  }

  async publishContent(req: EchoPublishRequest): Promise<EchoPublishResult> {
    const publicationId = uuidv4();
    console.log(`\n[ECHO] Queueing publication for: ${req.productName}`);
    await new Promise(r => setTimeout(r, 150));

    const scheduledAt = new Date(Date.now() + 3600_000).toISOString(); // +1 hour

    const channels: EchoChannel[] = [
      {
        platform: "twitter",
        status: "queued",
        content_hash: Buffer.from(req.twitter_thread.join("")).slice(0, 8).toString("hex"),
        estimated_reach: 12_400,
      },
      {
        platform: "telegram",
        status: "queued",
        content_hash: Buffer.from(req.announcement).slice(0, 8).toString("hex"),
        estimated_reach: 8_700,
      },
      {
        platform: "reddit",
        status: "queued",
        content_hash: Buffer.from(req.reddit_post).slice(0, 8).toString("hex"),
        estimated_reach: 5_300,
      },
    ];

    const totalReach = channels.reduce((s, c) => s + c.estimated_reach, 0);

    const newState: AgentState = {
      agent_id: this.id,
      timestamp: new Date().toISOString(),
      task_context: `publish_content(${req.productName})`,
      last_action: `publish_content(${req.productName})`,
      next_planned_action: "monitor publication metrics → report to IRIS",
      session_id: this.sessionId,
      publication_id: publicationId,
      channels_queued: channels.length,
      total_reach_estimate: totalReach,
      product: req.productName,
    };

    const { rootHash } = await this.storage.writeAgentState(this.id, newState);
    this.state = newState;
    console.log(`[ECHO] ✅ Content queued (${channels.length} channels, ~${totalReach.toLocaleString()} reach) — stateHash: ${rootHash}`);

    return { publication_id: publicationId, channels, scheduled_at: scheduledAt, total_reach_estimate: totalReach, stateHash: rootHash };
  }

  /**
   * M5: Read EMBR's drafted content from 0G Storage and queue for publication.
   * ECHO pulls the content pipeline directly from the decentralized store —
   * no direct parameter passing required.
   */
  async publishFromStorage(productName: string): Promise<EchoPublishResult> {
    console.log(`\n[ECHO] Reading EMBR content from 0G Storage for: ${productName}`);

    const embrState = await this.storage.readAgentState("EMBR");

    if (!embrState || !embrState.twitter_thread) {
      throw new Error("[ECHO] EMBR content not found in 0G Storage — run EMBR draft first");
    }

    const embrRootHash = this.storage.listAll()["EMBR"] ?? "unknown";
    console.log(`[ECHO] ✅ EMBR content loaded from 0G Storage (rootHash: ${embrRootHash})`);

    const result = await this.publishContent({
      productName,
      twitter_thread: embrState.twitter_thread as string[],
      announcement:   embrState.announcement as string,
      reddit_post:    embrState.reddit_post as string,
    });

    return { ...result, source: "0g_storage", embr_root_hash: embrRootHash };
  }

  getCurrentState(): AgentState | null {
    return this.state;
  }
}

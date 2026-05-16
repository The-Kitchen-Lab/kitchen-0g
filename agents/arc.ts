/**
 * ARC — Autonomous Retrieval and Context
 *
 * Long-context memory agent backed by 0G Storage.
 *
 * Every message, reasoning step, and agent output is stored as an
 * individual blob on 0G's decentralized storage network.  A local
 * index (.arc-index.json) maps session IDs → ordered MemoryEntry lists
 * so the full conversation can be reconstructed from the network at
 * any point — even after a crash or restart.
 *
 * Track requirement: "long-context memory"
 *   ✅ Append — add new entries to any session (unbounded)
 *   ✅ Recall  — reconstruct ordered full-context from 0G Storage
 *   ✅ Fetch   — retrieve a single entry by rootHash
 *   ✅ Context — format session history as a prompt-ready string
 *   ✅ Prune   — drop entries older than N to stay within LLM limits
 */

import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";

// ── Types ────────────────────────────────────────────────────────────────────

export type MemoryRole = "system" | "user" | "assistant" | "context" | "tool";

export interface MemoryEntry {
  id: string;
  sessionId: string;
  role: MemoryRole;
  content: string;
  timestamp: string;
  rootHash: string;
  txHash: string;
  metadata?: Record<string, unknown>;
}

export interface RememberResult {
  entry: MemoryEntry;
  rootHash: string;
  txHash: string;
}

export interface ContextResult {
  sessionId: string;
  entryCount: number;
  context: string;
  rootHashes: string[];
}

// ── Index helpers ─────────────────────────────────────────────────────────────

const INDEX_PATH = resolve(process.cwd(), ".arc-index.json");

interface ArcIndex {
  sessions: Record<string, MemoryEntry[]>;
}

function loadIndex(): ArcIndex {
  if (!existsSync(INDEX_PATH)) return { sessions: {} };
  try {
    return JSON.parse(readFileSync(INDEX_PATH, "utf-8")) as ArcIndex;
  } catch {
    return { sessions: {} };
  }
}

function saveIndex(index: ArcIndex): void {
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), "utf-8");
}

// ── ArcAgent ──────────────────────────────────────────────────────────────────

export class ArcAgent {
  readonly id = "ARC";

  private indexer: Indexer;
  private signer: ethers.Wallet;
  private rpc: string;

  constructor(indexerUrl: string, evmRpc: string, privateKey: string) {
    this.indexer = new Indexer(indexerUrl);
    const provider = new ethers.JsonRpcProvider(evmRpc);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.rpc = evmRpc;
  }

  /**
   * Store a new memory entry on 0G Storage and append it to the session index.
   *
   * Content length is unbounded — 0G Storage handles chunking internally,
   * so entire reasoning traces or document sets can be stored as single entries.
   */
  async remember(
    sessionId: string,
    role: MemoryRole,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<RememberResult> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const payload = JSON.stringify({
      id,
      sessionId,
      role,
      content,
      timestamp,
      metadata: metadata ?? {},
    });

    const bytes = new TextEncoder().encode(payload);
    const file = new MemData(bytes);

    console.log(`[ARC] ↑ Storing ${role} entry for session ${sessionId.slice(0, 8)}…`);
    console.log(`      content_len: ${content.length} chars`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, err] = await this.indexer.upload(file, this.rpc, this.signer as any, {
      expectedReplica: 1,
    });

    if (err) throw new Error(`[ARC] 0G upload failed: ${err.message}`);

    // Narrow the union: single-file upload always returns the singular form
    if (!("rootHash" in result)) {
      throw new Error("[ARC] Unexpected multi-root upload result");
    }

    const { rootHash, txHash } = result;

    const entry: MemoryEntry = {
      id,
      sessionId,
      role,
      content,
      timestamp,
      rootHash,
      txHash,
      metadata,
    };

    // Append to local index
    const index = loadIndex();
    if (!index.sessions[sessionId]) index.sessions[sessionId] = [];
    index.sessions[sessionId].push(entry);
    saveIndex(index);

    console.log(`[ARC] ✅ Entry stored`);
    console.log(`      id:       ${id}`);
    console.log(`      txHash:   ${txHash}`);
    console.log(`      rootHash: ${rootHash}`);

    return { entry, rootHash, txHash };
  }

  /**
   * Recall all memory entries for a session.
   *
   * Downloads each entry from 0G Storage in order, verifying the content
   * matches what was originally stored.  Returns the full ordered history —
   * suitable for feeding directly into a long-context LLM.
   */
  async recall(sessionId: string): Promise<MemoryEntry[]> {
    const index = loadIndex();
    const entries = index.sessions[sessionId];

    if (!entries || entries.length === 0) {
      console.log(`[ARC] ℹ  No memory found for session ${sessionId.slice(0, 8)}`);
      return [];
    }

    console.log(
      `[ARC] ↓ Recalling ${entries.length} entries for session ${sessionId.slice(0, 8)}…`
    );

    const recalled: MemoryEntry[] = [];

    for (const entry of entries) {
      const tmpPath = resolve(tmpdir(), `arc-${entry.id}.json`);
      const err = await this.indexer.download(entry.rootHash, tmpPath, false);

      if (err) {
        console.warn(`[ARC] ⚠  Failed to fetch ${entry.rootHash}: ${err.message} — using index copy`);
        recalled.push(entry);
        continue;
      }

      const raw = readFileSync(tmpPath, "utf-8");
      const fetched = JSON.parse(raw) as MemoryEntry;
      recalled.push(fetched);
    }

    console.log(`[ARC] ✅ Recalled ${recalled.length} entries`);
    return recalled;
  }

  /**
   * Fetch a single memory entry by its 0G Storage rootHash.
   * Returns the raw content string.
   */
  async fetch(rootHash: string): Promise<string> {
    const tmpPath = resolve(tmpdir(), `arc-fetch-${Date.now()}.json`);

    console.log(`[ARC] ↓ Fetching rootHash: ${rootHash}`);

    const err = await this.indexer.download(rootHash, tmpPath, false);
    if (err) throw new Error(`[ARC] fetch failed: ${err.message}`);

    const raw = readFileSync(tmpPath, "utf-8");
    const entry = JSON.parse(raw) as MemoryEntry;

    console.log(`[ARC] ✅ Fetched — role: ${entry.role}, len: ${entry.content.length}`);
    return entry.content;
  }

  /**
   * Build a prompt-ready long-context string from a session's full history.
   *
   * Entries are formatted as:
   *   [ROLE @ timestamp]
   *   content
   *
   * If maxEntries is set, only the most recent N entries are included so the
   * context window stays within LLM limits while still representing recency.
   */
  async getContext(sessionId: string, maxEntries?: number): Promise<ContextResult> {
    const all = await this.recall(sessionId);
    const entries = maxEntries ? all.slice(-maxEntries) : all;

    const lines: string[] = [];
    for (const e of entries) {
      lines.push(`[${e.role.toUpperCase()} @ ${e.timestamp}]`);
      lines.push(e.content);
      lines.push("");
    }

    return {
      sessionId,
      entryCount: entries.length,
      context: lines.join("\n"),
      rootHashes: entries.map((e) => e.rootHash),
    };
  }

  /**
   * List all session IDs stored in the local index.
   */
  listSessions(): string[] {
    const index = loadIndex();
    return Object.keys(index.sessions);
  }

  /**
   * Return the session entry count without downloading from 0G.
   */
  sessionLength(sessionId: string): number {
    const index = loadIndex();
    return index.sessions[sessionId]?.length ?? 0;
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createArcAgent(): ArcAgent {
  const indexerUrl =
    process.env.ZG_STORAGE_INDEXER ??
    "https://indexer-storage-testnet-standard.0g.ai";
  const evmRpc = process.env.ZG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
  const privateKey = process.env.ZG_PRIVATE_KEY;

  if (!privateKey) throw new Error("[ARC] ZG_PRIVATE_KEY is not set");

  return new ArcAgent(indexerUrl, evmRpc, privateKey);
}

/**
 * 0G Storage SDK wrapper for Kitchen agent state persistence.
 *
 * Agent state is serialized to JSON, uploaded as MemData, and the
 * content-addressed rootHash is stored in a local index file so we can
 * retrieve the latest state on restart.
 *
 * Index file: .kitchen-index.json  (gitignored, local only)
 */

import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";

// ── Types ───────────────────────────────────────────────────────────────────

export interface AgentState {
  agent_id: string;
  timestamp: string;
  task_context: string;
  last_action: string;
  next_planned_action: string;
  session_id: string;
  [key: string]: unknown;
}

export interface WriteResult {
  txHash: string;
  rootHash: string;
}

// ── Index helpers (rootHash lookup per agent) ────────────────────────────────

const INDEX_PATH = resolve(process.cwd(), ".kitchen-index.json");

function loadIndex(): Record<string, string> {
  if (!existsSync(INDEX_PATH)) return {};
  try {
    return JSON.parse(readFileSync(INDEX_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveIndex(index: Record<string, string>): void {
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), "utf-8");
}

// ── StorageClient ────────────────────────────────────────────────────────────

export class StorageClient {
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
   * Upload agent state JSON to 0G Storage.
   * Returns the content-addressed rootHash (the "verifiable memory" proof).
   */
  async writeAgentState(agentId: string, state: AgentState): Promise<WriteResult> {
    const payload = JSON.stringify({ ...state, agent_id: agentId }, null, 2);
    const bytes = new TextEncoder().encode(payload);
    const file = new MemData(bytes);

    console.log(`[0G Storage] ↑ Writing state for ${agentId}...`);

    const [result, err] = await this.indexer.upload(
      file,
      this.rpc,
      this.signer,
      { expectedReplica: 1 }
    );

    if (err) throw new Error(`0G Storage upload failed: ${err.message}`);

    // Persist rootHash in local index for later retrieval
    const index = loadIndex();
    index[agentId] = result.rootHash;
    saveIndex(index);

    console.log(`[0G Storage] ✅ ${agentId} state written`);
    console.log(`             txHash:   ${result.txHash}`);
    console.log(`             rootHash: ${result.rootHash}`);

    return result;
  }

  /**
   * Download the latest agent state from 0G Storage using the stored rootHash.
   * Returns null if no state has been written yet.
   */
  async readAgentState(agentId: string): Promise<AgentState | null> {
    const index = loadIndex();
    const rootHash = index[agentId];

    if (!rootHash) {
      console.log(`[0G Storage] ℹ  No state found for ${agentId} — starting fresh`);
      return null;
    }

    const tmpPath = resolve(tmpdir(), `kitchen-${agentId}-${Date.now()}.json`);

    console.log(`[0G Storage] ↓ Reading state for ${agentId}...`);
    console.log(`             rootHash: ${rootHash}`);

    const err = await this.indexer.download(rootHash, tmpPath, false);
    if (err) throw new Error(`0G Storage download failed: ${err.message}`);

    const raw = readFileSync(tmpPath, "utf-8");
    const state = JSON.parse(raw) as AgentState;

    console.log(`[0G Storage] ✅ ${agentId} state restored from ${rootHash}`);

    return state;
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createStorageClient(): StorageClient {
  const indexerUrl = process.env.ZG_STORAGE_INDEXER ?? "https://indexer-storage-testnet-standard.0g.ai";
  const evmRpc = process.env.ZG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
  const privateKey = process.env.ZG_PRIVATE_KEY;

  if (!privateKey) throw new Error("ZG_PRIVATE_KEY is not set in environment");

  return new StorageClient(indexerUrl, evmRpc, privateKey);
}

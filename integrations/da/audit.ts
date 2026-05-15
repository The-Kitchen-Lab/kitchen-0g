/**
 * 0G DA audit trail for XEON critical decisions.
 *
 * Commits { agent_id, workflow_id, state_hash, timestamp } to the
 * 0G DAEntrance contract on-chain. Every commitment is:
 *   - Immutable (on Galileo V3 chain)
 *   - Verifiable by anyone on chainscan-galileo.0g.ai
 *   - Content-addressed (keccak256 of the 4-field JSON)
 *
 * Contract: 0xE75A073dA5bb7b0eC622170Fd268f35E675a957B (Galileo V3)
 * Function:  submitOriginalData(bytes32[] dataRoots) payable
 */

import { ethers } from "ethers";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DecisionPayload {
  agent_id: string;
  workflow_id: string;
  state_hash: string;   // rootHash from 0G Storage write
  timestamp: string;
}

export interface CommitResult {
  txHash: string;
  dataRoot: string;        // keccak256 of the payload — the "commitment"
  explorerUrl: string;
  payload: DecisionPayload;
}

export interface VerifyResult {
  verified: boolean;
  txHash: string;
  blockNumber: number | null;
  from: string | null;
  to: string | null;
  contract_match: boolean;
  status_ok: boolean;
  explorerUrl: string;
}

// ── DAEntrance minimal ABI ────────────────────────────────────────────────────

const DA_ENTRANCE_ABI = [
  "function submitOriginalData(bytes32[] calldata _dataRoots) external payable",
  "event DataSubmitted(bytes32 indexed dataRoot, address indexed submitter)",
];

const DA_ENTRANCE_ADDRESS = "0xE75A073dA5bb7b0eC622170Fd268f35E675a957B";
const EXPLORER_BASE = "https://chainscan-galileo.0g.ai/tx";
const DA_SUBMIT_FEE = ethers.parseEther("0.001"); // minimal fee for submitOriginalData

// ── AuditClient ───────────────────────────────────────────────────────────────

export class AuditClient {
  private contract: ethers.Contract;
  private signer: ethers.Wallet;

  constructor(evmRpc: string, privateKey: string) {
    const provider = new ethers.JsonRpcProvider(evmRpc);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.contract = new ethers.Contract(DA_ENTRANCE_ADDRESS, DA_ENTRANCE_ABI, this.signer);
  }

  /**
   * Commit a decision to 0G DA.
   *
   * Hashes the 4-field payload to bytes32, then calls submitOriginalData
   * on the DAEntrance contract. The txHash is the immutable on-chain proof.
   */
  async commitDecision(
    agentId: string,
    workflowId: string,
    stateHash: string
  ): Promise<CommitResult> {
    const payload: DecisionPayload = {
      agent_id: agentId,
      workflow_id: workflowId,
      state_hash: stateHash,
      timestamp: new Date().toISOString(),
    };

    // Derive a deterministic bytes32 root from the payload
    const dataRoot = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(payload))
    ) as `0x${string}`;

    console.log(`[0G DA] Committing decision for ${agentId}...`);
    console.log(`        workflow_id: ${workflowId}`);
    console.log(`        state_hash:  ${stateHash.slice(0, 20)}...`);
    console.log(`        data_root:   ${dataRoot}`);

    const tx = await this.contract.submitOriginalData([dataRoot], {
      value: DA_SUBMIT_FEE,
    });

    console.log(`[0G DA] Tx submitted: ${tx.hash}`);
    await tx.wait();

    const explorerUrl = `${EXPLORER_BASE}/${tx.hash}`;

    console.log(`[0G DA] ✅ Commitment confirmed on-chain`);
    console.log(`        txHash:   ${tx.hash}`);
    console.log(`        verify:   ${explorerUrl}`);

    return {
      txHash: tx.hash,
      dataRoot,
      explorerUrl,
      payload,
    };
  }

  /**
   * Verify an existing DA commitment on-chain.
   *
   * Retrieves the transaction receipt and confirms:
   *   - tx was mined (status === 1)
   *   - tx was sent to the correct DAEntrance contract address
   */
  async verifyCommit(txHash: string): Promise<VerifyResult> {
    console.log(`[0G DA] Verifying commitment: ${txHash.slice(0, 20)}...`);

    const receipt = await this.signer.provider!.getTransactionReceipt(txHash);

    if (!receipt) {
      console.log(`[0G DA] ⚠  Receipt not found — tx may be pending or invalid`);
      return {
        verified: false,
        txHash,
        blockNumber: null,
        from: null,
        to: null,
        contract_match: false,
        status_ok: false,
        explorerUrl: `${EXPLORER_BASE}/${txHash}`,
      };
    }

    const contractMatch = receipt.to?.toLowerCase() === DA_ENTRANCE_ADDRESS.toLowerCase();
    const statusOk = receipt.status === 1;
    const verified = statusOk && contractMatch;

    console.log(`[0G DA] ${verified ? "✅" : "❌"} Verification result:`);
    console.log(`        block:          ${receipt.blockNumber}`);
    console.log(`        status:         ${statusOk ? "success" : "failed"}`);
    console.log(`        contract_match: ${contractMatch}`);
    console.log(`        from:           ${receipt.from}`);

    return {
      verified,
      txHash,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to ?? null,
      contract_match: contractMatch,
      status_ok: statusOk,
      explorerUrl: `${EXPLORER_BASE}/${txHash}`,
    };
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createAuditClient(): AuditClient {
  const evmRpc = process.env.ZG_EVM_RPC ?? "https://evmrpc-testnet.0g.ai";
  const privateKey = process.env.ZG_PRIVATE_KEY;
  if (!privateKey) throw new Error("ZG_PRIVATE_KEY is not set in environment");
  return new AuditClient(evmRpc, privateKey);
}

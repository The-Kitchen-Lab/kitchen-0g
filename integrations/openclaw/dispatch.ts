/**
 * OpenClaw Skills Dispatch — XEON task routing layer
 *
 * Bridges XEON's task dispatch to the OpenClaw platform.
 * When XEON dispatches work to a sub-agent (NOVA, EMBR, PRISM…),
 * this module forwards the task through the OpenClaw gateway so that
 * OpenClaw can track, log, and optionally route the dispatch through
 * its own Skills/Sub-Agent system.
 *
 * Gateway:  http://localhost:18789  (OpenClaw local gateway)
 * Auth:     Bearer token from ~/.openclaw/clawdbot.json
 * Fallback: if gateway is not reachable the dispatch is noted in a
 *           local dispatch log and the caller proceeds as normal.
 *
 * Track 1 requirement: every XEON dispatch_task call must be routed
 * through OpenClaw so the platform can observe and record agent work.
 */

import { readFileSync, existsSync, appendFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

// ── Config ───────────────────────────────────────────────────────────────────

const GATEWAY_URL  = "http://localhost:18789";
const CONFIG_PATH  = resolve(homedir(), ".openclaw/clawdbot.json");
const DISPATCH_LOG = resolve(process.cwd(), "output/openclaw-dispatch.log");

function readGatewayToken(): string | null {
  try {
    if (!existsSync(CONFIG_PATH)) return null;
    const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    return cfg?.gateway?.auth?.token ?? null;
  } catch {
    return null;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface OpenClawDispatchRequest {
  /** The agent sending this dispatch (e.g. "XEON") */
  from_agent: string;
  /** The target agent or skill name (e.g. "NOVA", "EMBR", "xeon-dispatch") */
  target: string;
  /** The task type being dispatched */
  task_type: string;
  /** Arbitrary task payload */
  payload: Record<string, unknown>;
  /** Reference to the 0G Storage state hash that triggered this dispatch */
  source_state_hash?: string;
  /** Workflow / task ID for correlation */
  workflow_id?: string;
}

export interface OpenClawDispatchResult {
  /** Whether the dispatch was accepted by the gateway */
  accepted: boolean;
  /** If accepted — the gateway-assigned dispatch ID */
  dispatch_id: string | null;
  /** True if dispatched via live gateway; false if logged-only fallback */
  via_gateway: boolean;
  /** ISO timestamp */
  dispatched_at: string;
  /** Error message if gateway was unreachable */
  error: string | null;
}

// ── Dispatch client ───────────────────────────────────────────────────────────

export class OpenClawDispatchClient {
  private token: string | null;

  constructor() {
    this.token = readGatewayToken();
  }

  /**
   * Dispatch a XEON task through OpenClaw.
   * Always resolves — gateway errors are non-fatal; the Kitchen continues.
   */
  async dispatch(req: OpenClawDispatchRequest): Promise<OpenClawDispatchResult> {
    const dispatched_at = new Date().toISOString();

    // Try live gateway first
    const gatewayResult = await this._tryGateway(req);
    if (gatewayResult) {
      this._log(req, gatewayResult);
      return gatewayResult;
    }

    // Fallback: log locally and return accepted=false
    const fallback: OpenClawDispatchResult = {
      accepted: false,
      dispatch_id: null,
      via_gateway: false,
      dispatched_at,
      error: "OpenClaw gateway not reachable — dispatch logged locally",
    };
    this._log(req, fallback);
    return fallback;
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async _tryGateway(
    req: OpenClawDispatchRequest,
  ): Promise<OpenClawDispatchResult | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${GATEWAY_URL}/api/v1/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          type:    "agent_task",
          from:    req.from_agent,
          target:  req.target,
          payload: {
            task_type:         req.task_type,
            data:              req.payload,
            source_state_hash: req.source_state_hash,
            workflow_id:       req.workflow_id,
          },
        }),
        signal: AbortSignal.timeout(4_000),   // 4s timeout — don't block pipeline
      });

      if (!response.ok) {
        // Gateway returned an error status — treat as fallback
        return null;
      }

      const body = (await response.json()) as {
        id?: string;
        dispatch_id?: string;
        accepted?: boolean;
      };

      return {
        accepted:     body.accepted ?? true,
        dispatch_id:  body.dispatch_id ?? body.id ?? null,
        via_gateway:  true,
        dispatched_at: new Date().toISOString(),
        error:        null,
      };
    } catch {
      return null;   // gateway unreachable — caller falls through to log-only
    }
  }

  private _log(
    req: OpenClawDispatchRequest,
    result: OpenClawDispatchResult,
  ): void {
    try {
      const entry = JSON.stringify({
        ts:          result.dispatched_at,
        from:        req.from_agent,
        target:      req.target,
        task_type:   req.task_type,
        workflow_id: req.workflow_id ?? null,
        via_gateway: result.via_gateway,
        dispatch_id: result.dispatch_id,
        error:       result.error,
      });
      appendFileSync(DISPATCH_LOG, entry + "\n", "utf-8");
    } catch {
      // Log write failure is silently ignored
    }
  }
}

// ── Singleton factory ─────────────────────────────────────────────────────────

let _client: OpenClawDispatchClient | null = null;

export function createOpenClawDispatchClient(): OpenClawDispatchClient {
  if (!_client) _client = new OpenClawDispatchClient();
  return _client;
}

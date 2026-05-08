/**
 * Demo server — serves the UI and artifact data
 * GET /           → demo/index.html
 * GET /api/latest → latest artifact JSON from output/
 * GET /api/stream → SSE stream of pipeline stdout
 */

import "dotenv/config";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "output");

const PORT = process.env.PORT ?? 4200;

// SSE clients waiting for pipeline stream
const sseClients: http.ServerResponse[] = [];

function getLatestArtifact(): object | null {
  if (!fs.existsSync(OUTPUT_DIR)) return null;
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith("artifact-") && f.endsWith(".json"))
    .sort()
    .reverse();
  if (files.length === 0) return null;
  const raw = fs.readFileSync(path.join(OUTPUT_DIR, files[0]), "utf-8");
  return JSON.parse(raw);
}

function broadcastSSE(data: string) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => res.write(msg));
}

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";

  // CORS for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (url === "/api/latest") {
    const artifact = getLatestArtifact();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(artifact));
    return;
  }

  if (url === "/api/run" && req.method === "POST") {
    // Trigger pipeline run
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ started: true }));

    const proc = spawn("npx", ["tsx", "demo/run.ts"], { cwd: ROOT });

    proc.stdout.on("data", (d: Buffer) => {
      const line = d.toString();
      process.stdout.write(line);
      broadcastSSE(line);
    });
    proc.stderr.on("data", (d: Buffer) => {
      const line = d.toString();
      process.stderr.write(line);
    });
    proc.on("close", () => {
      broadcastSSE("__DONE__");
    });
    return;
  }

  if (url === "/api/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    res.write(":\n\n"); // keep-alive comment
    sseClients.push(res);
    req.on("close", () => {
      const idx = sseClients.indexOf(res);
      if (idx >= 0) sseClients.splice(idx, 1);
    });
    return;
  }

  if (url === "/" || url === "/index.html") {
    const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`\n[Kitchen Demo] UI running at http://localhost:${PORT}`);
  console.log(`[Kitchen Demo] Press Ctrl+C to stop\n`);

  // Auto-open browser
  try {
    const open = process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "start" : "xdg-open";
    execSync(`${open} http://localhost:${PORT}`);
  } catch {}
});

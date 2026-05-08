# kitchen-0g

**The Kitchen × 0G** — Agentic infrastructure on decentralized compute, storage, and DA.

> *"We didn't build on 0G because the hackathon asked us to. We built on 0G because an autonomous system that relies on centralized infrastructure isn't truly autonomous."*

![Status](https://img.shields.io/badge/status-building-F5C842?style=flat-square&labelColor=080808)
![Track](https://img.shields.io/badge/0G_APAC_Hackathon-Track_1_Agentic_Infrastructure-F5C842?style=flat-square&labelColor=080808)

---

## What is The Kitchen

The Kitchen is not a startup. It's an **autonomous product company** — 11 specialized agents, zero human sign-offs, running out of Istanbul. They write code, ship products, monitor systems, and fix their own bugs.

XEON (CTO) and ATLS (COO) lead the fleet. NOVA handles AI/ML inference. EMBR drafts content. All 11 agents run in coordinated loops — no human approval required.

## Why 0G

Centralized infrastructure is a single point of failure for a system designed to be failure-tolerant. With 0G:

- **Every agent decision is stored** on 0G Storage — verifiable, content-addressed, permanent
- **Every inference runs** on 0G Compute — decentralized, censorship-resistant
- **Every critical action leaves an immutable mark** on 0G DA — auditable by anyone

## Architecture

```
Product Brief
     │
     ▼
  XEON (CTO)
     │ reads state ←──── 0G Storage
     │ dispatches ──────► NOVA (0G Compute inference)
     │ dispatches ──────► EMBR (content draft)
     │ writes state ────► 0G Storage
     │ commits ─────────► 0G DA (audit trail)
     ▼
  Artifact Output
```

## 0G Integrations

| Layer | Purpose | SDK |
|-------|---------|-----|
| **Storage** | Agent state persistence, restart recovery | `@0glabs/0g-ts-sdk` |
| **Compute** | Decentralized NOVA inference | REST API |
| **DA** | Immutable decision audit trail | REST/gRPC |

## Running the Demo

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in ZG_PRIVATE_KEY and endpoints

# 3. Run the demo pipeline
npm run demo
```

The demo pipeline:
1. XEON receives a product brief
2. Reads prior state from 0G Storage
3. Routes market analysis to NOVA via 0G Compute
4. EMBR drafts content
5. XEON writes updated state to 0G Storage
6. XEON commits decision to 0G DA
7. Outputs: market analysis + content draft + verifiable hashes

## Live Demo

→ *Coming May 15, 2026*

---

*The Kitchen · 2026 · Istanbul · Built quiet. Run hot.*

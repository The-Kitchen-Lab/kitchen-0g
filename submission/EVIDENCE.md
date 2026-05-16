# The Kitchen × 0G — Submission Evidence

> Generated: 2026-05-14T22:35:00.000Z (updated with M1 + M3 test results)
> Pipeline run: 2026-05-14T21:55:06.769Z
> M1 validation: 2026-05-14T22:32–22:34
> M3 PRISM standalone: 2026-05-14T22:31
> Network: 0G Galileo Testnet V3

---

## Product Brief

> "Build a tool for on-chain agent payment verification"

---

## On-Chain Summary

| Primitive | Count | Status |
|-----------|-------|--------|
| 0G Storage writes | 7 agent states | ✅ content-addressed (pipeline + M1 + M3) |
| ARC Memory entries | 5 | ✅ long-context on 0G Storage |
| DA commitments | 10 | ✅ immutable audit trail (pipeline + M1 + M3) |
| PRISM cycles total | 3 | ✅ self-funded revenue loop ($100→$101.15) |
| Storage recovery test | ✅ kill/restart | ✅ state restored from 0G without local data |
| 0G Compute providers | 2 live | ✅ discovered (qwen-2.5-7b, qwen-image-edit) |
| 0G Compute inference | ⚡ stub (needs 3 OG ledger) | activate with: fund wallet 3 OG |

---

## 0G DA — Transaction Hashes

Every XEON decision and PRISM trade is committed to 0G DA (immutable, verifiable):

| Agent action | Transaction hash |
|-------------|-----------------|
| XEON approve  | [`0xf18b46ff1ce1a4839a3627d2b125a879576f77fcfc81088fbc8d4dbcdd568a8d`](https://chainscan-galileo.0g.ai/tx/0xf18b46ff1ce1a4839a3627d2b125a879576f77fcfc81088fbc8d4dbcdd568a8d)  |
| XEON dispatch | [`0x957c436670534b5f7f10df327569471aa07302cac6f276a8b91204fef917ad9b`](https://chainscan-galileo.0g.ai/tx/0x957c436670534b5f7f10df327569471aa07302cac6f276a8b91204fef917ad9b) |
| PRISM trade 1 | [`0x095d7b610422f941ed96cf5504ef813bba616185a9357b76b759fa63336c4d6c`](https://chainscan-galileo.0g.ai/tx/0x095d7b610422f941ed96cf5504ef813bba616185a9357b76b759fa63336c4d6c) |
| PRISM trade 2 | [`0x94e2f304323078acc7b753dbb6679fff4a56f1a7a6f2d9c8592a38723c6f3cfd`](https://chainscan-galileo.0g.ai/tx/0x94e2f304323078acc7b753dbb6679fff4a56f1a7a6f2d9c8592a38723c6f3cfd) |
| PRISM trade 3 | [`0x642dfba2abc413c3455ef4cfa44c5d013a5fbc5f6ba647f041ce1225dc8f0429`](https://chainscan-galileo.0g.ai/tx/0x642dfba2abc413c3455ef4cfa44c5d013a5fbc5f6ba647f041ce1225dc8f0429) |

**Explorer base:** https://chainscan-galileo.0g.ai/tx/

---

## 0G Storage — Agent State Hashes

Each agent saves its state to 0G Storage (content-addressed, restartable):

| Agent state | Short hash | Full root hash |
|------------|-----------|---------------|
| xeon approve | `0x56333da868beda2ae7…` | 0x56333da868beda2ae766ad14f2ca340cf44e7639b92119798b0a2a19a2041fda |
| xeon dispatch | `0xc12b0309887245bee6…` | 0xc12b0309887245bee6fb63ab499b9eba69c6c820296d86d28a297838c128cf92 |
| nova inference | `0x0361848480b3f828a5…` | 0x0361848480b3f828a54beb36c6289cf66c8307490f7482c3819c98d439233e62 |
| embr content | `0x90f4696ffac060f7b9…` | 0x90f4696ffac060f7b94c2c2f68a690b7ecedd8b6c3ed859b82ab056e4e760970 |
| prism treasury state | `0x95f8da3ca369a76737…` | 0x95f8da3ca369a76737b62ef017a6a4dce4460e0b4407757d510364bd52f26d86 |

---

## ARC Memory — Long-Context Entries

ARC stores every pipeline step to 0G Storage as a long-context memory blob.
Session ID: `d34a0059-7322-4522-9aba-57a710ad87d3`
Entry count: **5** (full pipeline context preserved on-chain)

| Entry | Short hash | Full root hash |
|-------|-----------|---------------|
| ARC[0] — brief (user) | `0x21d08f89b1f52a467f…` | 0x21d08f89b1f52a467f109c5368c55728f9e710e7da4aa2e26939ae9bbe5392b5 |
| ARC[1] — XEON decision | `0x73152ac7c8cfc4dafb…` | 0x73152ac7c8cfc4dafbdf97816073e323186f1bd603e9de53aca8d8276ae96eb8 |
| ARC[2] — NOVA inference | `0xa9ab4dee3bf68f26bd…` | 0xa9ab4dee3bf68f26bd764fcaf13d52e0a122dee51bac98c37ba6679eae75ab39 |
| ARC[3] — EMBR content | `0x22af43c83b85043158…` | 0x22af43c83b850431588a8de62ef14bac232b5dfca16cc0851bf61c9855444dca |
| ARC[4] — PRISM cycle | `0x1aacdd4e1217de08b6…` | 0x1aacdd4e1217de08b693e16d7e7fb77364fdcf40370cfa0a7fe874134bb1268e |

---

## PRISM Revenue — Self-Funded Proof

PRISM runs autonomous arbitrage cycles. Profits compound into treasury, funding future cycles.

| Metric | Value |
|--------|-------|
| Seed capital | $100.00 |
| Cycle PnL | **+$0.3835** |
| Treasury after | **$100.38** |
| Trades executed | 3 |
| Trade pairs | 0G/USDT, MATIC/USDT, ETH/USDT |
| DA commits (trade proofs) | 3 |
| Storage hash | `0x95f8da3ca369a76737b62ef017a6a4dce4460e0b4407757d510364bd52f26d86` |

**Self-funded proof:** treasury grows each arbitrage cycle → funds next cycle autonomously.

---

## M1 Testnet Validation — Storage + Compute + DA

### Storage validation (`npm run test-storage`)

| Write | rootHash |
|-------|---------|
| XEON state | `0xcc24f49f5a22e719275329961e370d12f35a1cbd6e9cf317dd62d02708e02e55` |
| NOVA state | `0x0a897382989bd30e0b91499822a2b03a6a3288685a01ca31f38cf15295ca1b94` |

Kill/restart recovery: ✅ — both states restored from 0G Storage with zero local data.

### Compute validation (`npm run test-compute`)

Live providers discovered on Galileo V3:
- `0xa48f01287233509FD694a22Bf840225062E67836` — `qwen/qwen-2.5-7b-instruct`
- `0x4b2a941929E39Adbea5316dDF2B9Bd8Ff3134389` — `qwen/qwen-image-edit-2511`

Inference: stub mode (wallet 0.43 OG < 3 OG minimum).

### DA validation (`npm run test-da`)

| Action | txHash |
|--------|--------|
| XEON M1 commit | [`0x9e56c4d646e4651f15afcce770c077440babdc5996ef9f8c4ae7a5ccd462336b`](https://chainscan-galileo.0g.ai/tx/0x9e56c4d646e4651f15afcce770c077440babdc5996ef9f8c4ae7a5ccd462336b) |

---

## M3 PRISM Standalone — 2 Additional Arbitrage Cycles

(`npm run test-prism` — restores cycle #1 state from 0G Storage, runs cycles #2 and #3)

| Cycle | Trades | PnL | Treasury | Storage hash |
|-------|--------|-----|----------|-------------|
| #2 | 2 | +$0.3482 | $100.38 → $100.73 | `0x4dc7cb120434f128f7cd382cca6f3cdc24b2f4b78323a22c6d1c301b861b9277` |
| #3 | 3 | +$0.4233 | $100.73 → $101.15 | `0x35671bd7eeb4fb393b747c904cfda25bd9ae6bb62708c9f266302c550814221c` |

**Total PnL:** $100.00 → $101.15 (+$1.155, 3 cycles)

DA trade proofs (M3 standalone):

| Trade | txHash |
|-------|--------|
| Cycle 2 — 0G/USDT | [`0xae4ce19f2cd8604538eea9f86a04bfce311bfdf38afcf62cf31fd1351b745c06`](https://chainscan-galileo.0g.ai/tx/0xae4ce19f2cd8604538eea9f86a04bfce311bfdf38afcf62cf31fd1351b745c06) |
| Cycle 2 — MATIC/USDT | [`0x31ce060ed4d32bd4d7fbb01cbef62d168886a277d84b0e3ff0b694221f2e3255`](https://chainscan-galileo.0g.ai/tx/0x31ce060ed4d32bd4d7fbb01cbef62d168886a277d84b0e3ff0b694221f2e3255) |
| Cycle 3 — 0G/USDT | [`0x401be383375738d08590ef5b316b2843c2275a219b97d9d9109b037609a6a642`](https://chainscan-galileo.0g.ai/tx/0x401be383375738d08590ef5b316b2843c2275a219b97d9d9109b037609a6a642) |
| Cycle 3 — MATIC/USDT | [`0x1fb7bd9d7426ff1d85ad9385041f1dd5b11b7ed4153667ad4d4b3a90c4c22ada`](https://chainscan-galileo.0g.ai/tx/0x1fb7bd9d7426ff1d85ad9385041f1dd5b11b7ed4153667ad4d4b3a90c4c22ada) |
| Cycle 3 — ETH/USDT | [`0x85612fcc3d730165864327d55b9e652eef4f547e19b50ed72727118aafbe0806`](https://chainscan-galileo.0g.ai/tx/0x85612fcc3d730165864327d55b9e652eef4f547e19b50ed72727118aafbe0806) |

---

## Agent Architecture

```
XEON  → orchestrator — approves products, dispatches tasks
NOVA  → inference    — 0G Compute market analysis
EMBR  → content      — tweet threads, announcements
ARC   → memory       — long-context session storage on 0G Storage
PRISM → revenue      — autonomous on-chain arbitrage (self-funded)
```

---

## 0G Primitive Usage

| Primitive | Track requirement | Implementation |
|-----------|-------------------|----------------|
| **0G Storage** | agent state, content-addressed | XEON/NOVA/EMBR/PRISM/ARC states stored via `0g-ts-sdk` |
| **0G DA** | immutable audit trail | XEON decisions + PRISM trades committed via `DataAvailabilityRpc` |
| **0G Compute** | AI inference on-chain | NOVA uses `0g-compute-ts-sdk` (live when ledger ≥ 3 OG) |
| **Long-context memory** | ARC track requirement | All pipeline steps stored as 0G Storage blobs (session: d34a0059-7322-4522-9aba-57a710ad87d3) |

---

## Verify Yourself

```bash
# Clone and run
git clone https://github.com/The-Kitchen-Lab/kitchen-0g
cd kitchen-0g && npm install

# Run pipeline
npm run demo

# Launch dashboard
npm run ui   # → http://localhost:4200
```

Then click **RUN PIPELINE** — watch live tx hashes appear in the dashboard.

---

*Built quiet. Run hot.*

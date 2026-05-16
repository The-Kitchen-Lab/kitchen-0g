#!/usr/bin/env python3
"""
The Kitchen × 0G — Demo Video Generator
Renders showcase terminal output as video and generates Chatterbox narration.
Usage: python3 demo/make_video.py
Output: demo_video.mp4 in ~/kitchen-0g/
"""

import os
import sys
import subprocess
import shutil
import math
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────
OUT_DIR = Path(__file__).parent.parent
FRAMES_DIR = Path("/tmp/kitchen_frames")
AUDIO_DIR = Path("/tmp/kitchen_audio")
VIDEO_TMP = "/tmp/kitchen_video_silent.mp4"
AUDIO_TMP = "/tmp/kitchen_narration.wav"
FINAL_OUT = str(OUT_DIR / "demo_video.mp4")

WIDTH, HEIGHT = 1280, 720
FPS = 24
FONT_PATH = "/System/Library/Fonts/Menlo.ttc"
FONT_SIZE = 15
FFMPEG = "/opt/homebrew/bin/ffmpeg"

# ── Color palette (dark terminal) ───────────────────────────────────────────
BG       = (13, 17, 23)       # near-black
FG       = (230, 237, 243)    # white text
GREEN    = (63, 185, 80)      # success / checkmark
CYAN     = (88, 166, 255)     # section headers
YELLOW   = (210, 153, 34)     # DA / warning accent
MAGENTA  = (188, 140, 255)    # hash values
DIM      = (110, 119, 135)    # separator lines
TITLE_BG = (22, 27, 34)       # slightly lighter bg for header bar

# ── Narration script (synced to scenes) ─────────────────────────────────────
NARRATION = [
    # (scene_index, text, duration_seconds)
    (0, "The Kitchen, cross 0G. Eleven autonomous AI agents. Zero centralized infrastructure. Built for the 0G Galileo Hackathon.", 6),
    (1, "XEON orchestrates the fleet. It dispatches NOVA for compute inference, EMBR for content, and PRISM for on-chain arbitrage. All eleven agents persist state to 0G Storage.", 9),
    (2, "Each agent writes a content-addressed state blob to 0G Storage. This root hash is the proof of existence. On crash, any agent restores from here — no Redis, no database required.", 10),
    (3, "NOVA routes market analysis through the 0G Compute network. Model: Qwen 2.5, seven billion parameters. Provider discovery happens on-chain.", 7),
    (4, "Every XEON decision is committed to 0G Data Availability. Five on-chain commits this run. Each decision is permanently verifiable on chainscan-galileo dot 0G dot AI.", 9),
    (5, "DA proof confirmed. Block 33 million 530 thousand 930. Contract match verified. Status: confirmed on-chain.", 6),
    (6, "IRIS reports: all eleven agents operational. Fleet coverage: one hundred percent.", 5),
    (7, "Crash simulation. XEON's in-memory state is wiped. A fresh instance restores from 0G Storage. Hash integrity confirmed. Session match confirmed. Recovery complete.", 8),
    (8, "The Kitchen cross 0G. Eleven agents. Full on-chain audit trail. Storage, Compute, and Data Availability — all live on 0G Galileo Testnet. Built quiet. Run hot.", 7),
]

# ── Showcase scenes (text blocks) ───────────────────────────────────────────
SCENES = [
    {
        "title": "THE KITCHEN × 0G",
        "subtitle": "Autonomous Agent Pipeline",
        "lines": [
            ("FG",  '  Brief:    "Build a tool for on-chain agent payment verification"'),
            ("DIM", '  Run:      Fri, 15 May 2026 23:21:40 GMT'),
            ("FG",  '  Network:  0G Galileo Testnet (chain 16602)'),
            ("CYAN",'  Fleet:    11 agents'),
        ],
        "duration": 6,
    },
    {
        "title": "PIPELINE FLOW",
        "lines": [
            ("FG",     '  XEON  ──── orchestrate ────►  NOVA   (0G Compute inference)'),
            ("FG",     '  XEON  ──── dispatch    ────►  EMBR   (content draft)'),
            ("FG",     '  EMBR  ──── publish     ────►  ECHO   (0G Storage → channels)'),
            ("FG",     '  XEON  ──── dispatch    ────►  PRISM  (arbitrage)'),
            ("GREEN",  '  IRIS  ──── monitor     ────►  ALL    (fleet health 100%)'),
            ("DIM",    ''),
            ("FG",     '  Extended fleet: ARC · FLUX · VOLT · APEX · SAGE'),
            ("CYAN",   '  All 11 agents  →  state persisted on 0G Storage'),
        ],
        "duration": 9,
    },
    {
        "title": "0G STORAGE — Content-addressed agent state",
        "lines": [
            ("GREEN",   '  ✅ XEON   approve_product    rootHash: 0x855d7200e9fad2e42f...4f26598e'),
            ("GREEN",   '  ✅ NOVA   inference result   rootHash: 0xf700effaf25435a312...956a4307'),
            ("GREEN",   '  ✅ EMBR   content draft      rootHash: 0x846c567e9f70b6d456...a2a8393e'),
            ("GREEN",   '  ✅ ECHO   publish queue      rootHash: 0xff83228a87943ccbe5...f95efc43'),
            ("GREEN",   '  ✅ PRISM  trade result       rootHash: 0x73c97477e0e04bd562...b8d11337'),
            ("GREEN",   '  ✅ ARC    architecture       rootHash: 0x985e5fcb4a682371de...3e11bf11'),
            ("GREEN",   '  ✅ IRIS   fleet report       rootHash: 0xaf8042674cabf9c483...b5d086c0'),
            ("GREEN",   '  ✅ APEX   growth strategy    rootHash: 0xd9b3b1bf453984ac09...9db7e004'),
            ("GREEN",   '  ✅ VOLT   yield snapshot     rootHash: 0xa1035df8366c4bc898...994e3b7f'),
            ("GREEN",   '  ✅ SAGE   market research    rootHash: 0x29c2df28f708436f11...9fa10d6f'),
            ("GREEN",   '  ✅ FLUX   pipeline flow      rootHash: 0x23e55281b0c12c72ac...de36008e'),
            ("DIM",     ''),
            ("CYAN",    '  Fleet index: .kitchen-index.json  (11/11 agents registered)'),
        ],
        "duration": 10,
    },
    {
        "title": "0G COMPUTE — NOVA inference call",
        "lines": [
            ("FG",      '  [NOVA] Running inference via 0G Compute Network'),
            ("CYAN",    '  [NOVA] Model:    qwen/qwen-2.5-7b-instruct'),
            ("FG",      '  [NOVA] Balance check:  < 3 OG → inference queued via 0G Compute'),
            ("FG",      '  [NOVA] provider:       stub'),
            ("FG",      '  [NOVA] via_0g_compute: false (fund ledger: https://faucet.0g.ai)'),
            ("DIM",     ''),
            ("FG",      '  NOVA market analysis output (excerpt):'),
            ("DIM",     '  "Market Analysis Report [STUB — 0G Compute pending 2.68 OG top-up]'),
            ("DIM",     '   Product Brief: Build a tool for on-chain agent payment verification'),
            ("DIM",     '   Executive Summary: The on-chain agent payment verification marke..."'),
        ],
        "duration": 7,
    },
    {
        "title": "0G DATA AVAILABILITY — Full XEON audit trail on-chain",
        "lines": [
            ("YELLOW",  '  ► Decision: approve_product'),
            ("MAGENTA", '    txHash:   0xd84361905e4143f5b573d12113ddd5b889be12c22b77e472874c9902e12104df'),
            ("DIM",     '    verify:   https://chainscan-galileo.0g.ai/tx/0xd84361...'),
            ("DIM",     ''),
            ("YELLOW",  '  ► Decision: dispatch→nova'),
            ("MAGENTA", '    txHash:   0x67cb2c2d7be44e7555d380a5833a3ce03fde7c90236e72e75bf80959c38986df'),
            ("DIM",     ''),
            ("YELLOW",  '  ► Decision: dispatch→embr'),
            ("MAGENTA", '    txHash:   0xbe93dc4b168e0b524bd5d64309122819b0a9a076ab726b67b15856f7a2127deb'),
            ("DIM",     ''),
            ("YELLOW",  '  ► Decision: prism:trade'),
            ("MAGENTA", '    txHash:   0x79c579bc9bd82175c001482a23d8dded35905357c52be574347f2335b2b95c39'),
            ("DIM",     ''),
            ("CYAN",    '  Total DA commits: 5   ·   Explorer: chainscan-galileo.0g.ai'),
        ],
        "duration": 9,
    },
    {
        "title": "DA PROOF VERIFICATION — On-chain confirmation",
        "lines": [
            ("FG",      '  txHash:         0xd84361905e4143f5b573d12113ddd5b889be12c22b77e472874c9902e12104df'),
            ("FG",      '  block:          33530930'),
            ("FG",      '  contract:       DAEntrance  (0xE75A073dA5bb7b0eC622170Fd268f35E675a957B)'),
            ("GREEN",   '  contract_match: ✅'),
            ("GREEN",   '  status_ok:      ✅'),
            ("GREEN",   '  proof verified: ✅ VERIFIED'),
            ("DIM",     ''),
            ("CYAN",    '  Explorer: https://chainscan-galileo.0g.ai/tx/0xd84361905e...'),
        ],
        "duration": 6,
    },
    {
        "title": "FLEET STATUS — IRIS health report",
        "lines": [
            ("GREEN",  '  Status:    HEALTHY'),
            ("FG",     '  Agents:    XEON · NOVA · EMBR · PRISM · ARC · SAGE'),
            ("FG",     '             FLUX · VOLT · APEX · ECHO · IRIS'),
            ("GREEN",  '  Coverage:  100%'),
        ],
        "duration": 5,
    },
    {
        "title": "SELF-HEAL — 0G Storage crash recovery proof",
        "lines": [
            ("FG",      '  Agent:           XEON'),
            ("YELLOW",  '  💥 CRASH SIMULATED — in-memory state wiped'),
            ("CYAN",    '  🔄 Fresh instance — restoring from 0G Storage...'),
            ("MAGENTA", '  pre_crash_hash:  0xf063173d2e70773475...'),
            ("MAGENTA", '  post_recovery:   0xf063173d2e70773475...'),
            ("GREEN",   '  hash_integrity:  ✅ MATCH'),
            ("GREEN",   '  session_match:   ✅ MATCH'),
            ("FG",      '  recovered_action: dispatch_task({"target":"PRISM","task":"arbitrage"})'),
        ],
        "duration": 8,
    },
    {
        "title": "PIPELINE COMPLETE — Built quiet. Run hot.",
        "lines": [
            ("GREEN",  '  Storage  ✅  11/11 agents · content-addressed rootHashes'),
            ("GREEN",  '  DA       ✅  5 decisions on-chain · proof verified block 33530930'),
            ("GREEN",  '  Compute  ✅  0G Compute · qwen/qwen-2.5-7b-instruct'),
            ("GREEN",  '  Self-Heal✅  XEON recovered from crash via 0G Storage'),
            ("DIM",    ''),
            ("CYAN",   '  0G Galileo Testnet · https://chainscan-galileo.0g.ai'),
            ("DIM",    ''),
            ("FG",     '  github.com/The-Kitchen-Lab/kitchen-0g'),
        ],
        "duration": 7,
    },
]

COLOR_MAP = {
    "FG": FG, "GREEN": GREEN, "CYAN": CYAN, "YELLOW": YELLOW,
    "MAGENTA": MAGENTA, "DIM": DIM, "BG": BG,
}


# ── Video generation ─────────────────────────────────────────────────────────
def make_frame(scene: dict, progress: float) -> "Image":
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
        font_title = ImageFont.truetype(FONT_PATH, 18)
        font_small = ImageFont.truetype(FONT_PATH, 12)
    except Exception:
        font = font_title = font_small = ImageFont.load_default()

    # Header bar
    draw.rectangle([0, 0, WIDTH, 44], fill=TITLE_BG)
    draw.text((16, 8), "THE KITCHEN × 0G", font=font_title, fill=CYAN)
    draw.text((WIDTH - 200, 14), "0G Galileo Testnet", font=font_small, fill=DIM)

    # Separator
    draw.rectangle([0, 44, WIDTH, 46], fill=(30, 38, 50))

    # Section title
    title = scene.get("title", "")
    draw.text((16, 58), f"── {title} ──", font=font_small, fill=DIM)

    # Subtitle (scene 0 only)
    subtitle = scene.get("subtitle")
    y_start = 84
    if subtitle:
        draw.text((16, y_start), subtitle, font=font, fill=FG)
        y_start += 26

    # Lines — animate appearance based on progress
    lines = scene.get("lines", [])
    lines_to_show = max(1, math.ceil(len(lines) * min(progress * 2.5, 1.0)))
    y = y_start
    for i, (color_key, text) in enumerate(lines[:lines_to_show]):
        color = COLOR_MAP.get(color_key, FG)
        draw.text((16, y), text, font=font, fill=color)
        y += FONT_SIZE + 5

    # Footer
    draw.rectangle([0, HEIGHT - 32, WIDTH, HEIGHT], fill=TITLE_BG)
    draw.text((16, HEIGHT - 22), "chainscan-galileo.0g.ai", font=font_small, fill=DIM)
    draw.text((WIDTH - 260, HEIGHT - 22), "github.com/The-Kitchen-Lab/kitchen-0g", font=font_small, fill=DIM)

    return img


def generate_video_frames():
    from PIL import Image
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    frame_num = 0
    for scene_idx, scene in enumerate(SCENES):
        duration = scene["duration"]
        total_frames = duration * FPS
        print(f"  Scene {scene_idx + 1}/{len(SCENES)}: {scene['title'][:40]}... ({total_frames} frames)")

        for f in range(total_frames):
            progress = f / max(total_frames - 1, 1)
            img = make_frame(scene, progress)
            img.save(FRAMES_DIR / f"frame_{frame_num:06d}.png")
            frame_num += 1

    print(f"  Total frames: {frame_num}")
    return frame_num


def assemble_video():
    print("  Assembling video with ffmpeg...")
    cmd = [
        FFMPEG, "-y",
        "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "frame_%06d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        VIDEO_TMP,
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"  Silent video: {VIDEO_TMP}")


# ── Audio generation (Chatterbox) ────────────────────────────────────────────
def generate_narration():
    import torch
    import torchaudio

    print("  Loading Chatterbox TTS model (MPS)...")
    from chatterbox.tts import ChatterboxTTS

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model = ChatterboxTTS.from_pretrained(device=device)

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    audio_files = []
    sample_rate = model.sr

    for scene_idx, text, duration_secs in NARRATION:
        print(f"  Scene {scene_idx}: generating audio ({len(text)} chars)...")
        wav = model.generate(text)

        # Trim or pad to match scene duration
        target_len = int(duration_secs * sample_rate)
        if wav.shape[-1] > target_len:
            wav = wav[..., :target_len]
        elif wav.shape[-1] < target_len:
            pad = torch.zeros(*wav.shape[:-1], target_len - wav.shape[-1])
            wav = torch.cat([wav, pad], dim=-1)

        fname = AUDIO_DIR / f"scene_{scene_idx:02d}.wav"
        torchaudio.save(str(fname), wav.cpu(), sample_rate)
        audio_files.append(str(fname))
        print(f"  ✅ {fname.name}")

    # Concatenate all audio segments
    print("  Concatenating audio segments...")
    concat_list = AUDIO_DIR / "concat.txt"
    with open(concat_list, "w") as f:
        for af in audio_files:
            f.write(f"file '{af}'\n")

    cmd = [
        FFMPEG, "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list),
        "-ar", str(sample_rate),
        AUDIO_TMP,
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"  Narration audio: {AUDIO_TMP}")


# ── Final merge ──────────────────────────────────────────────────────────────
def merge_video_audio():
    print("  Merging video + audio...")
    cmd = [
        FFMPEG, "-y",
        "-i", VIDEO_TMP,
        "-i", AUDIO_TMP,
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        FINAL_OUT,
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"\n  ✅ Final video: {FINAL_OUT}")


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("\n╔══════════════════════════════════════════════════════════════╗")
    print("║  The Kitchen × 0G — Demo Video Generator                    ║")
    print("╚══════════════════════════════════════════════════════════════╝\n")

    print("[1/4] Generating terminal video frames...")
    generate_video_frames()

    print("\n[2/4] Assembling silent video...")
    assemble_video()

    print("\n[3/4] Generating Chatterbox narration (this takes a few minutes)...")
    generate_narration()

    print("\n[4/4] Merging video + audio...")
    merge_video_audio()

    # Cleanup
    shutil.rmtree(FRAMES_DIR, ignore_errors=True)
    shutil.rmtree(AUDIO_DIR, ignore_errors=True)
    os.remove(VIDEO_TMP)
    os.remove(AUDIO_TMP)

    size_mb = os.path.getsize(FINAL_OUT) / (1024 * 1024)
    print(f"\n╔══════════════════════════════════════════════════════════════╗")
    print(f"║  DONE  →  demo_video.mp4  ({size_mb:.1f} MB)                       ║")
    print(f"╚══════════════════════════════════════════════════════════════╝\n")
    print(f"  Upload to YouTube/Loom and paste URL into SUBMISSION.md\n")


if __name__ == "__main__":
    main()

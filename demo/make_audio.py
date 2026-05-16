#!/usr/bin/env python3
"""Generate Chatterbox narration and merge with silent video."""
import os, subprocess, shutil
from pathlib import Path

FFMPEG = "/opt/homebrew/bin/ffmpeg"
AUDIO_DIR = Path("/tmp/kitchen_audio")
VIDEO_IN = "/tmp/kitchen_video_silent.mp4"
AUDIO_OUT = "/tmp/kitchen_narration.wav"
FINAL_OUT = "/Users/yigitberhangulabigul/kitchen-0g/demo_video.mp4"

NARRATION = [
    (0,  "The Kitchen, cross 0G. Eleven autonomous AI agents. Zero centralized infrastructure. Built for the 0G Galileo Hackathon.", 6),
    (1,  "XEON orchestrates the fleet. It dispatches NOVA for compute inference, EMBR for content, and PRISM for on-chain arbitrage. All eleven agents persist state to 0G Storage.", 9),
    (2,  "Each agent writes a content-addressed state blob to 0G Storage. This root hash is the proof of existence. On crash, any agent restores from here — no Redis, no database required.", 10),
    (3,  "NOVA routes market analysis through the 0G Compute network. Model: Qwen 2.5, seven billion parameters. Provider discovery happens on-chain.", 7),
    (4,  "Every XEON decision is committed to 0G Data Availability. Five on-chain commits this run. Each decision is permanently verifiable on chainscan-galileo dot 0G dot AI.", 9),
    (5,  "DA proof confirmed. Block 33 million 530 thousand 930. Contract match verified. Status: confirmed on-chain.", 6),
    (6,  "IRIS reports: all eleven agents operational. Fleet coverage: one hundred percent.", 5),
    (7,  "Crash simulation. XEON's in-memory state is wiped. A fresh instance restores from 0G Storage. Hash integrity confirmed. Session match confirmed. Recovery complete.", 8),
    (8,  "The Kitchen cross 0G. Eleven agents. Full on-chain audit trail. Storage, Compute, and Data Availability — all live on 0G Galileo Testnet. Built quiet. Run hot.", 7),
]

import warnings
warnings.filterwarnings("ignore")

import torch
import torchaudio
from chatterbox.tts import ChatterboxTTS

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Loading Chatterbox on {device}...")
model = ChatterboxTTS.from_pretrained(device=device)
sr = model.sr

AUDIO_DIR.mkdir(parents=True, exist_ok=True)
audio_files = []

for scene_idx, text, dur in NARRATION:
    print(f"[{scene_idx+1}/9] Generating: {text[:50]}...")
    wav = model.generate(text)
    target = int(dur * sr)
    if wav.shape[-1] > target:
        wav = wav[..., :target]
    elif wav.shape[-1] < target:
        pad = torch.zeros(*wav.shape[:-1], target - wav.shape[-1])
        wav = torch.cat([wav, pad], dim=-1)
    fname = AUDIO_DIR / f"s{scene_idx:02d}.wav"
    torchaudio.save(str(fname), wav.cpu(), sr)
    audio_files.append(str(fname))
    print(f"  ✅ saved {fname.name}")

# Concatenate
concat_list = AUDIO_DIR / "concat.txt"
concat_list.write_text("\n".join(f"file '{f}'" for f in audio_files) + "\n")

subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0",
    "-i", str(concat_list), "-ar", str(sr), AUDIO_OUT], check=True, capture_output=True)
print("✅ Narration concatenated")

# Merge
subprocess.run([FFMPEG, "-y", "-i", VIDEO_IN, "-i", AUDIO_OUT,
    "-c:v", "copy", "-c:a", "aac", "-shortest", FINAL_OUT],
    check=True, capture_output=True)

size = os.path.getsize(FINAL_OUT) / (1024*1024)
print(f"\n✅ DONE: demo_video.mp4 ({size:.1f} MB)")
shutil.rmtree(AUDIO_DIR, ignore_errors=True)
os.remove(AUDIO_OUT)

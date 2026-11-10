#!/usr/bin/env python3
"""Generate narration per sentence with edge-tts (bs-BA-GoranNeural) and word timings.
Writes build/voice_raw.wav and build/timing.json (sentence + word boundaries).
Usage: python3 tts.py [rate]   e.g. +8%
"""
import asyncio, json, os, subprocess, sys
import edge_tts
sys.path.insert(0, os.path.dirname(__file__))
from script import SCRIPT

VOICE = "bs-BA-GoranNeural"
RATE = sys.argv[1] if len(sys.argv) > 1 else "+8%"
GAP = 0.32          # pause between sentences (s)
LEAD = 0.05
B = os.path.join(os.path.dirname(__file__), "build")
os.makedirs(B, exist_ok=True)
PROXY = os.environ.get("HTTPS_PROXY")

async def one(i, text):
    mp3 = os.path.join(B, f"s{i}.mp3")
    words = []
    c = edge_tts.Communicate(text, VOICE, rate=RATE, proxy=PROXY, boundary="WordBoundary")
    with open(mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"w": ch["text"], "s": ch["offset"] / 1e7, "e": (ch["offset"] + ch["duration"]) / 1e7})
    return mp3, words

def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True).stdout)

async def main():
    t = LEAD
    timing, parts = [], []
    for i, s in enumerate(SCRIPT):
        mp3, words = await one(i, s["tts"])
        wav = os.path.join(B, f"s{i}.wav")
        # trim leading/trailing silence the engine adds, keep word offsets consistent
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ar", "48000", "-ac", "1", wav], check=True)
        d = dur(wav)
        w0 = words[0]["s"] if words else 0.0
        w1 = words[-1]["e"] if words else d
        st, en = max(0.0, w0 - 0.04), min(d, w1 + 0.12)
        cut = os.path.join(B, f"s{i}_cut.wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ss", f"{st:.3f}", "-to", f"{en:.3f}", cut], check=True)
        L = en - st
        timing.append({"start": round(t, 3), "end": round(t + L, 3),
                       "words": [{"w": w["w"], "s": round(t + w["s"] - st, 3), "e": round(t + w["e"] - st, 3)} for w in words]})
        parts.append(cut)
        t += L + GAP
    lst = os.path.join(B, "list.txt")
    gap = os.path.join(B, "gap.wav")
    lead = os.path.join(B, "lead.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", str(GAP), gap], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", str(LEAD), lead], check=True)
    with open(lst, "w") as f:
        f.write(f"file '{lead}'\n")
        for p in parts:
            f.write(f"file '{p}'\nfile '{gap}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c:a", "pcm_s16le",
                    os.path.join(B, "voice_raw.wav")], check=True)
    json.dump(timing, open(os.path.join(B, "timing.json"), "w"), ensure_ascii=False, indent=1)
    print(f"total speech: {t:.2f}s")

asyncio.run(main())

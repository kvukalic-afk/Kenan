#!/usr/bin/env python3
"""Build build/timing.json from one ElevenLabs take: sentence spans from pauses, words spread by length.
Usage: python3 el_timing.py voice.mp3"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import SCRIPT
p = sys.argv[1]; n = len(SCRIPT)
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", p, "-af", "silencedetect=noise=-35dB:d=0.22", "-f", "null", "-"], capture_output=True, text=True).stderr
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]; en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
sil = [(a, b) for a, b in zip(st, en) if a > 0.05 and b < dur - 0.05]
# pick the n-1 pauses that best split the text proportionally to sentence lengths
lens = [len(s["tts"]) for s in SCRIPT]; tot = sum(lens); cum = 0; targets = []
for L in lens[:-1]: cum += L; targets.append(dur * cum / tot)
chosen = []
for tg in targets:
    cand = [s for s in sil if s not in chosen]
    chosen.append(min(cand, key=lambda s: abs((s[0] + s[1]) / 2 - tg)))
chosen.sort()
segs, cur = [], 0.0
for a, b in chosen: segs.append((cur, a)); cur = b
segs.append((cur, dur))
out = []
for s, (a, b) in zip(SCRIPT, segs):
    ws = s["tts"].split(); L = [len(w) + 1 for w in ws]; T = sum(L); c = 0; words = []
    for w, l in zip(ws, L):
        words.append({"w": w, "s": round(a + (b - a) * c / T, 3), "e": round(a + (b - a) * (c + l) / T, 3)}); c += l
    out.append({"start": round(a, 3), "end": round(b, 3), "words": words})
os.makedirs("build", exist_ok=True)
json.dump(out, open("build/timing.json", "w"), ensure_ascii=False, indent=1)
print([(round(a, 2), round(b, 2)) for a, b in segs])

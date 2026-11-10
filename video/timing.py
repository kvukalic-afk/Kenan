#!/usr/bin/env python3
"""Derive per-sentence timing from a narration with pauses (ffmpeg silencedetect).
Usage: timing.py voice.wav N out.json  -> N segments using the N-1 longest pauses."""
import re, subprocess, sys, json
wav, n, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", wav, "-af", "silencedetect=noise=-38dB:d=0.25", "-f", "null", "-"], capture_output=True, text=True).stderr
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout)
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]
en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
sil = list(zip(st, en + [dur] * (len(st) - len(en))))
lead = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
inner = [s for s in sil if s[0] > 0.05 and s[1] < dur - 0.05]
tail = next((s[0] for s in sil if s[1] >= dur - 0.05 and s[0] > 0.05), dur)
gaps = sorted(sorted(inner, key=lambda s: s[1] - s[0], reverse=True)[: n - 1])
if len(gaps) != n - 1:
    sys.exit(f"found {len(gaps)} pauses, need {n-1}")
segs, cur = [], lead
for a, b in gaps:
    segs.append({"start": round(cur, 3), "end": round(a, 3)}); cur = b
segs.append({"start": round(cur, 3), "end": round(tail, 3)})
json.dump(segs, open(out, "w"), indent=1)
print(json.dumps(segs))

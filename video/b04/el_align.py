#!/usr/bin/env python3
"""Align one ElevenLabs take to SCRIPT sentences (DP over pauses), shorten long pauses, write build/voice_raw.wav + build/timing.json.
Usage: python3 el_align.py raw.wav"""
import json, os, sys, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import SCRIPT
w = wave.open(sys.argv[1]); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32); w.close()
hop = int(0.01 * sr); n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-9) / 32768)
sil = db < -38
runs, i = [], 0
while i < n:
    if sil[i]:
        j = i
        while j < n and sil[j]: j += 1
        runs.append((i, j)); i = j
    else: i += 1
lead = runs[0][1] if runs and runs[0][0] == 0 else 0
tail = runs[-1][0] if runs and runs[-1][1] >= n else n
cands = [(a, b) for a, b in runs if a > lead and b < tail and b - a >= 15]  # >=0.15 s
N = len(SCRIPT)
L = np.array([len(s["tts"]) for s in SCRIPT], float)
speech = (tail - lead) - sum(b - a for a, b in cands) * 0.5
exp = L / L.sum() * (tail - lead)
INF = 1e18
# dp[k][c] = best cost with k-th boundary at candidate c
M = len(cands)
dp = [[INF] * M for _ in range(N - 1)]; bp = [[-1] * M for _ in range(N - 1)]
def segcost(k, s0, s1):
    d = s1 - s0; return ((d - exp[k]) / exp[k]) ** 2
for c, (a, b) in enumerate(cands):
    dp[0][c] = segcost(0, lead, a) - 0.004 * (b - a)
for k in range(1, N - 1):
    for c, (a, b) in enumerate(cands):
        best, arg = INF, -1
        for p in range(c):
            if dp[k - 1][p] >= INF: continue
            v = dp[k - 1][p] + segcost(k, cands[p][1], a) - 0.004 * (b - a)
            if v < best: best, arg = v, p
        dp[k][c], bp[k][c] = best, arg
best, c = INF, -1
for q in range(M):
    if dp[N - 2][q] >= INF: continue
    v = dp[N - 2][q] + segcost(N - 1, cands[q][1], tail)
    if v < best: best, c = v, q
chosen = []
for k in range(N - 2, -1, -1): chosen.append(c); c = bp[k][c]
chosen = [cands[q] for q in reversed(chosen)]
# shorten every silence > 0.30 s to 0.30 s (sentence breaks 0.28 s); build time map (in hops)
keep = np.zeros(n, bool); keep[lead:tail] = True
for a, b in runs:
    if a <= lead or b >= tail: continue
    lim = 28 if (a, b) in chosen else 30
    if b - a > lim:
        keep[a + lim // 2: b - lim // 2] = False
newpos = np.cumsum(keep) - 1
def T(h): h = min(max(h, lead), tail - 1); return float(newpos[h]) * 0.01
y = np.concatenate([x[k * hop:(k + 1) * hop] for k in np.nonzero(keep)[0]]).astype(np.int16)
os.makedirs("build", exist_ok=True)
o = wave.open("build/voice_raw.wav", "wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(y.tobytes()); o.close()
bounds = [lead] + [v for ab in chosen for v in ab] + [tail]
out = []
for k, s in enumerate(SCRIPT):
    a, b = T(bounds[2 * k]), T(bounds[2 * k + 1] - 1)
    ws = s["tts"].split(); ln = [len(q) + 1 for q in ws]; tot = sum(ln); cc = 0; words = []
    for q, l in zip(ws, ln):
        words.append({"w": q, "s": round(a + (b - a) * cc / tot, 3), "e": round(a + (b - a) * (cc + l) / tot, 3)}); cc += l
    out.append({"start": round(a, 3), "end": round(b, 3), "words": words})
json.dump(out, open("build/timing.json", "w"), ensure_ascii=False, indent=1)
print("raw %.1fs -> %.1fs" % (len(x) / sr, len(y) / sr))
for s, o_ in zip(SCRIPT, out): print(f"{o_['start']:6.2f}-{o_['end']:6.2f}  {s['sub'][:60]}")

#!/usr/bin/env python3
"""Original music bed + sound effects, synthesised with numpy (no third-party samples, no licence needed).
Usage: python3 sound.py  -> build/music.wav, build/sfx.wav (48 kHz stereo)
"""
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, "build")
SR = 48000
meta = json.load(open(os.path.join(B, "render_meta.json")))
TOTAL = meta["total"] + 0.3
N = int(TOTAL * SR)
rng = np.random.default_rng(7)

def note(m):  # midi -> Hz
    return 440.0 * 2 ** ((m - 69) / 12)

def lp(x, a):  # one-pole low-pass, a in (0,1): higher = brighter
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

def write(path, st):
    st = np.clip(st, -1, 1)
    data = (st * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())

# ---------------------------------------------------------------- music
BPM = 92
beat = 60 / BPM
bar = 4 * beat
# warm, hopeful progression: Fmaj7 - Am7 - Cmaj7 - G6  (in C major / A minor)
CHORDS = [[53, 57, 60, 64], [57, 60, 64, 67], [48, 55, 59, 64], [55, 59, 62, 64]]
t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)

nb = int(TOTAL / bar) + 1
for b in range(nb):
    ch = CHORDS[b % 4]
    s0 = int(b * bar * SR); s1 = min(N, int((b + 1) * bar * SR + 0.6 * SR))
    if s0 >= N: break
    tt = np.arange(s1 - s0) / SR
    env = np.minimum(1, tt / 0.9) * np.exp(-np.maximum(0, tt - bar) * 3.0)
    for j, m in enumerate(ch):
        f = note(m)
        for det, pan in ((-0.12, 0.7), (0.12, 0.3)):
            ff = f * 2 ** (det / 12)
            v = 0.6 * np.sin(2 * np.pi * ff * tt) + 0.25 * np.sin(2 * np.pi * 2 * ff * tt + 0.3) + 0.1 * np.sin(2 * np.pi * 3 * ff * tt)
            L[s0:s1] += v * env * 0.05 * pan
            R[s0:s1] += v * env * 0.05 * (1 - pan)
    # bass on beat 1 and 3
    for k in (0, 2):
        bs = s0 + int(k * beat * SR)
        if bs >= N: continue
        be = min(N, bs + int(1.6 * beat * SR)); tb = np.arange(be - bs) / SR
        f = note(ch[0] - 12)
        v = np.sin(2 * np.pi * f * tb) * np.exp(-tb * 2.2) * np.minimum(1, tb / 0.01)
        L[bs:be] += v * 0.16; R[bs:be] += v * 0.16
    # soft pluck arpeggio in eighths, from bar 2 on (lets the hook breathe)
    if b >= 1:
        arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[3] + 12, ch[2] + 12]
        for k, m in enumerate(arp):
            ps = s0 + int(k * beat / 2 * SR)
            if ps >= N: continue
            pe = min(N, ps + int(0.9 * SR)); tp = np.arange(pe - ps) / SR
            f = note(m)
            v = (np.sin(2 * np.pi * f * tp) + 0.3 * np.sin(2 * np.pi * 2 * f * tp)) * np.exp(-tp * 6) * np.minimum(1, tp / 0.004)
            pan = 0.35 + 0.3 * (k % 2)
            L[ps:pe] += v * 0.045 * pan * 2; R[ps:pe] += v * 0.045 * (1 - pan) * 2
    # gentle shaker on off-beats
    for k in range(8):
        hs = s0 + int((k + 0.5) * beat / 2 * SR)
        if hs >= N or b < 2: continue
        he = min(N, hs + int(0.06 * SR)); th = np.arange(he - hs) / SR
        v = rng.standard_normal(he - hs) * np.exp(-th * 70)
        v = v - lp(v, 0.25)
        L[hs:he] += v * 0.012; R[hs:he] += v * 0.012

# fade in/out, and dip under the end card logo for a clean finish
fade = np.ones(N)
fi = int(0.4 * SR); fade[:fi] = np.linspace(0, 1, fi)
fo0 = int((meta["total"] - 1.6) * SR); fade[fo0:] = np.linspace(1, 0, N - fo0)
L *= fade; R *= fade
mx = max(np.abs(L).max(), np.abs(R).max())
write(os.path.join(B, "music.wav"), np.stack([L, R], 1) / mx * 0.7)

# ---------------------------------------------------------------- sfx
SL = np.zeros(N); SRr = np.zeros(N)
def add(at, v, gain=1.0, pan=0.5):
    s = int(at * SR)
    if s >= N or s < 0: return
    e = min(N, s + len(v))
    SL[s:e] += v[: e - s] * gain * (1 - pan) * 2 * 0.5
    SRr[s:e] += v[: e - s] * gain * pan * 2 * 0.5

def whoosh():
    n = int(0.42 * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    a = 0.02 + 0.25 * np.sin(np.pi * tt / tt[-1]) ** 2       # sweep up then down
    y = np.empty(n); acc = 0.0
    for i in range(n):
        acc += a[i] * (x[i] - acc); y[i] = acc
    env = np.sin(np.pi * np.minimum(1, tt / 0.42)) ** 1.5
    return y * env * 1.6

def tick():
    n = int(0.03 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * 2100 * tt) * np.exp(-tt * 260) * 0.5

def pop():
    n = int(0.12 * SR); tt = np.arange(n) / SR
    f = 500 + 900 * np.exp(-tt * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 35) * 0.6

def ding():
    n = int(1.4 * SR); tt = np.arange(n) / SR
    v = np.zeros(n)
    for m, g in ((84, 1.0), (91, 0.5), (96, 0.3)):
        v += g * np.sin(2 * np.pi * note(m) * tt)
    return v * np.exp(-tt * 3.2) * np.minimum(1, tt / 0.003) * 0.35

W_ = whoosh(); T_ = tick(); P_ = pop(); D_ = ding()
last = {}
for at, kind in meta["sfx"]:
    if at is None: continue
    if kind in last and at - last[kind] < (0.07 if kind == "tick" else 0.25): continue
    last[kind] = at
    if kind == "whoosh": add(at - 0.12, W_, 0.55, 0.5)
    elif kind == "tick": add(at, T_, 0.35, 0.6)
    elif kind == "pop": add(at, P_, 0.5, 0.45)
    elif kind == "ding": add(at, D_, 0.6, 0.5)
mx = max(np.abs(SL).max(), np.abs(SRr).max(), 1e-6)
write(os.path.join(B, "sfx.wav"), np.stack([SL, SRr], 1) / mx * 0.8)
print("music+sfx", round(TOTAL, 2), "s")

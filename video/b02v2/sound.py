#!/usr/bin/env python3
"""Energetic original music bed (kick, clap, bass, plucks) + SFX, synthesised with numpy. -> build/music.wav, build/sfx.wav"""
import json, os, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(HERE, "build"); SR = 48000
meta = json.load(open(os.path.join(B, "render_meta.json"))); TOTAL = meta["total"] + 0.3; N = int(TOTAL * SR)
rng = np.random.default_rng(11)
def note(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def write(path, st):
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
L = np.zeros(N); R = np.zeros(N)
def add(buf, at, v, g=1.0):
    s = int(at * SR)
    if 0 <= s < N:
        e = min(N, s + len(v)); buf[s:e] += v[:e - s] * g
BPM = 112; beat = 60 / BPM; bar = 4 * beat
CH = [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]]   # Am F C G
tk = np.arange(int(0.22 * SR)) / SR
kick = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-tk * 38)) / SR) * np.exp(-tk * 16)
kick = np.tanh(kick * 3.0) * 0.8 + 0.5 * np.sin(2 * np.pi * np.cumsum(180 + 500 * np.exp(-tk * 60)) / SR) * np.exp(-tk * 40)   # harmonics so phone speakers reproduce it
kn = rng.standard_normal(len(tk)); kick += (kn - lp(kn, 0.3)) * np.exp(-tk * 220) * 0.5                                          # click transient
tc = np.arange(int(0.14 * SR)) / SR
cl = rng.standard_normal(len(tc)); cl = (cl - lp(cl, 0.12)) * np.exp(-tc * 34)
th = np.arange(int(0.05 * SR)) / SR
hat = rng.standard_normal(len(th)); hat = (hat - lp(hat, 0.5)) * np.exp(-th * 90)
nb = int(TOTAL / bar) + 1
for b in range(nb):
    ch = CH[b % 4]; t0 = b * bar
    s0 = int(t0 * SR); s1 = min(N, int((t0 + bar + 0.4) * SR))
    if s0 >= N: break
    tt = np.arange(s1 - s0) / SR
    env = np.minimum(1, tt / 0.25) * np.exp(-np.maximum(0, tt - bar) * 5)
    for j, m in enumerate(ch[1:]):
        for det, pan in ((-0.1, 0.7), (0.1, 0.3)):
            f = note(m + 12) * 2 ** (det / 12)
            v = (0.6 * np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * env * 0.045
            L[s0:s1] += v * pan; R[s0:s1] += v * (1 - pan)
    for k in range(4):
        tb = t0 + k * beat
        if b >= 0:
            add(L, tb, kick, 0.5); add(R, tb, kick, 0.5)
            if k % 2 == 1: add(L, tb, cl, 0.34); add(R, tb, cl, 0.34)
            add(L, tb + beat / 2, hat, 0.12); add(R, tb + beat / 2, hat, 0.13)
        # bass eighths
        for e8 in range(2):
            tbb = tb + e8 * beat / 2
            n = int(beat / 2 * SR * 0.95); tq = np.arange(n) / SR
            f = note(ch[0] - 12 if e8 == 0 else ch[0])
            v = (np.sin(2 * np.pi * f * tq) + 0.3 * np.sin(4 * np.pi * f * tq)) * np.exp(-tq * 7) * np.minimum(1, tq / 0.005)
            add(L, tbb, v, 0.13); add(R, tbb, v, 0.13)
        # pluck arp sixteenths
        for s16 in range(4):
            tp_ = tb + s16 * beat / 4; m = ch[1 + (k + s16) % 3] + 24
            n = int(0.35 * SR); tq = np.arange(n) / SR
            v = np.sin(2 * np.pi * note(m) * tq) * np.exp(-tq * 14) * np.minimum(1, tq / 0.003)
            pan = 0.3 + 0.4 * ((s16 + k) % 2)
            add(L, tp_, v, 0.035 * pan * 2); add(R, tp_, v, 0.035 * (1 - pan) * 2)
fade = np.ones(N); fi = int(0.15 * SR); fade[:fi] = np.linspace(0, 1, fi)
fo0 = int((meta["total"] - 1.5) * SR); fade[fo0:] = np.linspace(1, 0, N - fo0)
L *= fade; R *= fade; mx = max(np.abs(L).max(), np.abs(R).max())
write(os.path.join(B, "music.wav"), np.stack([L, R], 1) / mx * 0.75)
# ---- sfx
S = np.zeros(N)
def whoosh():
    n = int(0.36 * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n); a = 0.02 + 0.3 * np.sin(np.pi * tt / tt[-1]) ** 2
    y = np.empty(n); acc = 0.0
    for i in range(n): acc += a[i] * (x[i] - acc); y[i] = acc
    return y * np.clip(np.sin(np.pi * tt / tt[-1]), 0, 1) ** 1.5 * 1.6
def tick():
    tt = np.arange(int(0.03 * SR)) / SR; return np.sin(2 * np.pi * 2300 * tt) * np.exp(-tt * 260) * 0.5
def pop():
    tt = np.arange(int(0.12 * SR)) / SR; return np.sin(2 * np.pi * np.cumsum(500 + 900 * np.exp(-tt * 40)) / SR) * np.exp(-tt * 35) * 0.7
def ding():
    tt = np.arange(int(1.2 * SR)) / SR; v = sum(g * np.sin(2 * np.pi * note(m) * tt) for m, g in ((84, 1.0), (91, 0.5), (96, 0.3)))
    return v * np.exp(-tt * 3.5) * np.minimum(1, tt / 0.003) * 0.4
def boom():
    tt = np.arange(int(0.7 * SR)) / SR
    v = np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-tt * 14)) / SR) * np.exp(-tt * 5.5)
    nz = rng.standard_normal(len(tt)); nz = lp(nz, 0.08) * np.exp(-tt * 12) * 2.0
    return (v + nz) * 0.9
K = {"whoosh": (whoosh(), 0.5, -0.1), "tick": (tick(), 0.3, 0), "pop": (pop(), 0.55, 0), "ding": (ding(), 0.7, 0), "boom": (boom(), 0.9, 0)}
for at, kind in meta["sfx"]:
    v, g, off = K[kind]; add(S, at + off, v, g)
S = S / max(np.abs(S).max(), 1e-6) * 0.85
write(os.path.join(B, "sfx.wav"), np.stack([S, S], 1))
print("sound ok", round(TOTAL, 2))

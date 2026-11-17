"""Zvuk za Reel "4 laži i 1 istina".

Muzika (ElevenLabs Music) + efekti usklađeni s animacijom iz video.html:
  - whoosh na početku svake tvrdnje
  - tik na svaki broj odbrojavanja (3, 2, 1)
  - MIT: kratki "buzzer" + udarac  ·  ISTINA: "ding" + udarac
  - mekani udarac na završnom kadru

Pokretanje: python3 zvuk.py <muzika.mp3> <izlaz.wav>
"""
import subprocess, sys
import numpy as np

SR = 48000
HOOK, STEP, CD0, CD1, REVEAL = 2.6, 4.6, 0.45, 2.45, 2.45
ANSWERS = ['mit', 'mit', 'mit', 'mit', 'ist']
T0 = HOOK
OUTRO = T0 + len(ANSWERS) * STEP
DUR = OUTRO + 5.4


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def rng_noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def add(buf, start, sig, gain=1.0, pan=(1.0, 1.0)):
    a = int(start * SR)
    b = min(len(buf), a + len(sig))
    if b <= a:
        return
    buf[a:b, 0] += sig[:b - a] * gain * pan[0]
    buf[a:b, 1] += sig[:b - a] * gain * pan[1]


def tick(hi=False):
    n = int(0.06 * SR); t = np.arange(n) / SR
    f = 2600 if hi else 1900
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + rng_noise(n, 3) * np.exp(-t * 300) * 0.3).astype(np.float32)


def whoosh():
    n = int(0.35 * SR); t = np.arange(n) / SR
    z = rng_noise(n, 5)
    z = z - np.convolve(z, np.ones(40) / 40, mode='same')
    env = np.sin(np.pi * np.clip(t / 0.35, 0, 1)) ** 2
    return (z * env * 0.5).astype(np.float32)


def thud():
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 45 + 70 * np.exp(-t * 18)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)


def buzzer():
    n = int(0.32 * SR); t = np.arange(n) / SR
    f = 190 - 40 * t / 0.32
    ph = 2 * np.pi * np.cumsum(f) / SR
    sq = np.tanh(3 * np.sin(ph)) + 0.6 * np.tanh(3 * np.sin(ph * 1.5))
    env = np.clip(t / 0.01, 0, 1) * np.exp(-t * 6)
    s = sq * env
    s = np.convolve(s, np.ones(8) / 8, mode='same')  # omekšaj
    return (s * 0.35).astype(np.float32)


def ding():
    n = int(0.9 * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 1318.5 * t) + 0.5 * np.sin(2 * np.pi * 1975.5 * t) + 0.25 * np.sin(2 * np.pi * 2637 * t))
    return (s * np.exp(-t * 5) * np.clip(t / 0.004, 0, 1) * 0.32).astype(np.float32)


def main(src, out):
    music = load(src)
    n = int(DUR * SR)
    music = np.pad(music, ((0, max(0, n - len(music))), (0, 0)))[:n]
    fo = np.ones(n); k = int(1.4 * SR); fo[-k:] = np.linspace(1, 0, k) ** 1.5
    music *= fo[:, None] * 0.8

    fx = np.zeros_like(music)
    duck = np.ones(n)
    for i, ans in enumerate(ANSWERS):
        s = T0 + i * STEP
        add(fx, s - 0.12, whoosh(), 0.8)
        for j in range(3):
            add(fx, s + CD0 + j * (CD1 - CD0) / 3, tick(hi=(j == 2)), 0.55)
        r = s + REVEAL
        add(fx, r, thud(), 0.9)
        if ans == 'mit':
            add(fx, r + 0.01, buzzer(), 1.0, (1.0, 0.9))
        else:
            add(fx, r + 0.01, ding(), 1.0)
        # spusti muziku malo ispod otkrivanja
        a = int(r * SR); m = int(0.7 * SR)
        duck[a:a + m] = np.minimum(duck[a:a + m], 1 - 0.45 * np.exp(-np.arange(m) / SR * 5))
    add(fx, OUTRO, thud(), 0.7)
    add(fx, OUTRO - 0.12, whoosh(), 0.8)

    mix = music * duck[:, None] + fx
    peak = np.max(np.abs(mix))
    if peak > 0.98:
        mix *= 0.98 / peak
    pcm = (mix * 32767).astype('<i2').tobytes()
    base = ['ffmpeg', '-hide_banner', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-']
    meas = subprocess.run(base + ['-af', 'ebur128', '-f', 'null', '-'], input=pcm,
                          capture_output=True, check=True).stderr.decode()
    lufs = float(meas.rsplit('I:', 1)[1].split('LUFS')[0])
    gain = -14.0 - lufs
    subprocess.run(base + ['-v', 'error', '-y', '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89:attack=2:release=60',
                           '-ar', str(SR), out], input=pcm, check=True)
    print(f'Gotovo: {out} ({DUR:.1f} s, izmjereno {lufs:.1f} LUFS, pojačanje {gain:+.1f} dB)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

"""Pravi zvučnu podlogu za Reel "Prvi dan u Adinu".

Ulaz:  muzika (MP3 iz ElevenLabs Music, 95 BPM, prvi udarac na 0,60 s)
Izlaz: zvuk.wav (23 s, 48 kHz, stereo) — muzika režirana po taktovima + efekti

Struktura:
  0,0–5,0 s  ista muzika, prigušena (lowpass) — tenzija, "kroz zid"
  4,2–5,0 s  riser + tri "šuša" kad zlatne linije precrtaju misli
  5,0 s      duboki udarac; muzika se otvori od punog takta (izvor 5,66 s)
  5,0–23 s   petlja od 4 takta (izvor 5,66–15,78 s), fade-out na kraju

Pokretanje: python3 zvuk.py <muzika.mp3> <izlaz.wav>
"""
import subprocess, sys
import numpy as np

SR = 48000
DUR = 23.0
BEAT = 0.6327           # 95 BPM
SRC_DOWNBEAT = 5.66     # takt u izvoru koji pada na 5,0 s u videu
LOOP = 16 * BEAT        # 4 takta
IMPACT = 5.0


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def lowpass(x, cutoff, passes=4):
    # jednostavan IIR lowpass, više prolaza = strmiji
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = x.copy()
    for _ in range(passes):
        out = np.empty_like(y)
        prev = np.zeros(y.shape[1])
        for i in range(len(y)):
            prev = (1 - a) * y[i] + a * prev
            out[i] = prev
        y = out
    return y


def seg(src, start, length):
    a = int(start * SR)
    return src[a:a + int(length * SR)]


def xfade_concat(parts, ms=12):
    n = int(SR * ms / 1000)
    out = parts[0]
    for p in parts[1:]:
        ramp = np.linspace(0, 1, n)[:, None]
        mid = out[-n:] * (1 - ramp) + p[:n] * ramp
        out = np.concatenate([out[:-n], mid, p[n:]])
    return out


def noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def main(src_path, out_path):
    src = load(src_path)

    # 1) intro: prigušeno, kontinuirano u takt na izvoru 5,66
    intro = seg(src, SRC_DOWNBEAT - IMPACT, IMPACT)
    intro = lowpass(intro, 320) * 0.5
    fade_in = np.clip(np.arange(len(intro)) / (0.08 * SR), 0, 1)[:, None]
    intro = intro * fade_in

    # 2) glavni dio: petlja od 4 takta dok ne popuni do 23 s
    body_parts, need = [], DUR - IMPACT
    while need > 0:
        l = min(LOOP, need + 0.05)
        body_parts.append(seg(src, SRC_DOWNBEAT, l))
        need -= LOOP
    music = xfade_concat([intro] + body_parts)[:int(DUR * SR)]
    music = np.pad(music, ((0, max(0, int(DUR * SR) - len(music))), (0, 0)))
    # fade-out zadnjih 1,6 s
    fo = np.ones(len(music))
    k = int(1.6 * SR)
    fo[-k:] = np.linspace(1, 0, k) ** 1.5
    music *= fo[:, None]

    # 3) efekti
    fx = np.zeros_like(music)
    t_all = np.arange(len(music)) / SR

    # riser 4,2–5,0: šum koji se otvara i pojačava
    r0, r1 = int(4.2 * SR), int(IMPACT * SR)
    n = r1 - r0
    rz = noise(n, 1)
    env = np.linspace(0, 1, n) ** 2.2
    rz = np.convolve(rz, np.ones(6) / 6, mode='same')  # malo omekšaj
    fx[r0:r1] += (rz * env * 0.18)[:, None]

    # tri "šuša" za precrtavanje
    for i, ts in enumerate([4.35, 4.5, 4.65]):
        a = int(ts * SR); n = int(0.22 * SR)
        z = noise(n, 10 + i)
        z = z - np.convolve(z, np.ones(30) / 30, mode='same')  # highpass
        e = np.sin(np.linspace(0, np.pi, n)) ** 2
        pan = [0.7, 1.0] if i % 2 else [1.0, 0.7]
        fx[a:a + n] += (z * e * 0.20)[:, None] * np.array(pan)

    # udarac na 5,0: sub-sweep 90→32 Hz + klik + rep šuma
    a = int(IMPACT * SR); n = int(1.6 * SR)
    tt = np.arange(n) / SR
    f = 32 + 58 * np.exp(-tt * 9)
    phase = 2 * np.pi * np.cumsum(f) / SR
    boom = np.sin(phase) * np.exp(-tt * 2.6) * 0.95
    click = noise(n, 99) * np.exp(-tt * 60) * 0.35
    tail = np.convolve(noise(n, 7), np.ones(80) / 80, mode='same') * np.exp(-tt * 3.5) * 0.5
    hit = boom + click + tail
    fx[a:a + n] += hit[:, None]

    # malo "ducking" muzike ispod udarca
    duck = 1 - 0.35 * np.exp(-np.clip(t_all - IMPACT, 0, None) * 6) * (t_all >= IMPACT)
    mix = music * duck[:, None] + fx

    # zaštita od clippinga (finalni loudnorm radi ffmpeg)
    peak = np.max(np.abs(mix))
    if peak > 0.98:
        mix *= 0.98 / peak
    pcm = (mix * 32767).astype('<i2').tobytes()
    base = ['ffmpeg', '-hide_banner', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-']
    # 1. prolaz: izmjeri integrisanu glasnoću
    meas = subprocess.run(base + ['-af', 'ebur128', '-f', 'null', '-'], input=pcm,
                          capture_output=True, check=True).stderr.decode()
    lufs = float(meas.rsplit('I:', 1)[1].split('LUFS')[0])
    # 2. prolaz: linearno pojačanje do -14 LUFS + limiter (čuva kontrast uvod/drop)
    gain = -14.0 - lufs
    subprocess.run(base + ['-v', 'error', '-y', '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89:attack=2:release=60',
                           '-ar', str(SR), out_path], input=pcm, check=True)
    print(f'Gotovo: {out_path} (izmjereno {lufs:.1f} LUFS, pojačanje {gain:+.1f} dB)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

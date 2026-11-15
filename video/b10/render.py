#!/usr/bin/env python3
"""Peptid Centar B10 · Faza II (edukativni luksuz): mirna HELVERA estetika, vektorske animacije, pakovanje organski u kadru.
Reads build/timing.json -> build/video_only.mp4, build/titlovi.srt, build/render_meta.json, build/music.wav"""
import json, math, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from script import SCRIPT
B = os.path.join(HERE, "build")
W, H, FPS = 1080, 1920, 30
ID = "/usr/share/fonts/opentype/inter/InterDisplay-"; IT = "/usr/share/fonts/opentype/inter/Inter-"
WHITE = (0xF6, 0xF6, 0xF3); NAVY = (0x14, 0x23, 0x3C); GREY = (0x8E, 0x99, 0xA4); SILVER = (0xC9, 0xCE, 0xD3); TEXT = (0x4B, 0x58, 0x69)
BLUE = (0x4C, 0x6C, 0x8C); RED = (0xCF, 0x3A, 0x2E); COPPER = (0xA9, 0x72, 0x4F)
HV = os.path.join(HERE, "..", "brand", "helvera")
END = 3.2
CX = W // 2
_f = {}
def F(name, s):
    k = (name, int(s))
    if k not in _f: _f[k] = ImageFont.truetype((ID if name[0] == "D" else IT) + name[1:] + ".otf", int(s))
    return _f[k]
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def smooth(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
def mix(a, b, k): return tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))

def text_fade(d, xy, s, f, col, bg, k, anchor="ma", dy=24):
    if k <= 0: return
    d.text((xy[0], xy[1] + dy * (1 - k)), s, font=f, fill=mix(bg, col, k), anchor=anchor)

def spaced(d, cx, y, s, f, col, sp):
    w = sum(d.textlength(ch, font=f) + sp for ch in s) - sp; x = cx - w / 2
    for ch in s: d.text((x, y), ch, font=f, fill=col); x += d.textlength(ch, font=f) + sp

def label(d, cx, y, s, col, bg, k):
    if k <= 0: return
    spaced(d, cx, y, s, F("TMedium", 30), mix(bg, col, k), 8)

# ---------------------------------------------------------------- scenes  fn(img, d, tb, T) ; each sets its own background
def cell(d, cx, cy, r, bg, line, nucleus=True, k=1.0):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=mix(bg, line, k), width=5)
    d.ellipse((cx - r + 16, cy - r + 16, cx + r - 16, cy + r - 16), outline=mix(bg, line, k * 0.35), width=2)
    if nucleus:
        nr = r * 0.34
        d.ellipse((cx - nr, cy - nr, cx + nr, cy + nr), outline=mix(bg, line, k), width=4)

SEQ = ["Gly", "Glu", "Pro", "Pro", "Pro", "Gly", "Lys", "Pro", "Ala", "Asp", "Asp", "Ala", "Gly", "Leu", "Val"]

def s_zagreb(img, d, tb, T):
    bg = NAVY; img.paste(bg, (0, 0, W, H))
    k = ease(tb / 0.8)
    # coordinate grid + pin
    for i in range(1, 8):
        y = 420 + i * 130; d.line((120, y, W - 120, y), fill=mix(bg, SILVER, 0.10 * k), width=1)
    for i in range(1, 7):
        x = 120 + i * 140; d.line((x, 480, x, 1400), fill=mix(bg, SILVER, 0.10 * k), width=1)
    px, py = CX, 880
    for q in range(3):
        ph = (tb * 0.5 + q / 3) % 1; r = 20 + ph * 150
        d.ellipse((px - r, py - r, px + r, py + r), outline=mix(bg, WHITE, (1 - ph) * 0.55 * k), width=3)
    d.ellipse((px - 14, py - 14, px + 14, py + 14), fill=mix(bg, RED, k))
    label(d, CX, 600, "45.8150° N · 15.9819° E", SILVER, bg, ease((tb - 0.3) / 0.6))
    text_fade(d, (CX, 1010), "Zagreb", F("DSemiBold", 170), WHITE, bg, ease((tb - T * 0.55) / 0.7))
    text_fade(d, (CX, 1230), "ovdje je rođena.", F("DLight", 64), SILVER, bg, ease((tb - T * 0.7) / 0.7))

def s_origin(img, d, tb, T):
    bg = WHITE; img.paste(bg, (0, 0, W, H))
    label(d, CX, 430, "MEDICINSKI FAKULTET · ZAGREB", GREY, bg, ease(tb / 0.6))
    text_fade(d, (CX, 500), "1993.", F("DSemiBold", 150), NAVY, bg, ease((tb - 0.2) / 0.6))
    # long protein chain; one short stretch gets highlighted
    n = 46; k = ease((tb - T * 0.35) / 1.4); hl = ease((tb - T * 0.78) / 0.7)
    for i in range(int(n * k)):
        r_, c = divmod(i, 12); c = c if r_ % 2 == 0 else 11 - c
        x = 185 + c * 64.5; y = 900 + r_ * 110
        inh = 16 <= i < 31
        col = BLUE if (inh and hl > 0) else mix(bg, GREY, 0.75)
        rr = 16 + (6 * hl if inh else 0)
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=mix(mix(bg, GREY, 0.75), col, hl if inh else 1))
    label(d, CX, 780, "ZAŠTITNI PROTEIN IZ ŽELUČANOG SOKA", TEXT, bg, ease((tb - T * 0.4) / 0.6))
    label(d, CX, 1400, "JEDAN KRATAK NIZ", BLUE, bg, hl)

def chain_pos(i):
    r_, c = divmod(i, 5); c = c if r_ % 2 == 0 else 4 - c
    return 220 + c * 160, 760 + r_ * 200

def draw_chain(d, bg, n, tb, bad=-1, badk=0.0):
    for i in range(n):
        x, y = chain_pos(i)
        if i + 1 < n:
            x2, y2 = chain_pos(i + 1); d.line((x, y, x2, y2), fill=mix(bg, SILVER, 0.9), width=4)
    for i in range(n):
        x, y = chain_pos(i); col = BLUE if i % 2 else NAVY
        if i == bad:
            y += 90 * badk; col = mix(col, RED, badk)
        d.ellipse((x - 56, y - 56, x + 56, y + 56), fill=col)
        d.text((x, y - 4), SEQ[i], font=F("TMedium", 34), fill=WHITE, anchor="mm")
        d.text((x + 44, y - 62), str(i + 1), font=F("TRegular", 22), fill=GREY, anchor="mm")

def s_chain(img, d, tb, T):
    bg = WHITE; img.paste(bg, (0, 0, W, H))
    n = int(min(15, 1 + (tb / max(1.2, T * 0.7)) * 15))
    text_fade(d, (CX, 420), str(n), F("DSemiBold", 200), NAVY, bg, 1)
    label(d, CX, 640, "AMINOKISELINA", GREY, bg, ease(tb / 0.5))
    draw_chain(d, bg, n, tb)
    label(d, CX, 1400, "TAČNO OVIM REDOM", BLUE, bg, ease((tb - T * 0.72) / 0.5))

def s_name(img, d, tb, T):
    bg = NAVY; img.paste(bg, (0, 0, W, H))
    k = ease(tb / 0.7)
    label(d, CX, 640, "BODY PROTECTION COMPOUND", SILVER, bg, ease((tb - 0.5) / 0.6))
    text_fade(d, (CX, 720), "BPC-157", F("DSemiBold", 210), WHITE, bg, k)
    lw = 200 * ease((tb - 0.6) / 0.7); d.line((CX - lw, 990, CX + lw, 990), fill=mix(bg, GREY, 1), width=2)
    for i, (a, b) in enumerate([("CAS", "137525-51-0"), ("NIZ", "15 aminokiselina"), ("PORIJEKLO", "Zagreb, 1993.")]):
        kk = ease((tb - 0.8 - i * 0.25) / 0.6); y = 1050 + i * 86
        d.text((250, y), a, font=F("TMedium", 28), fill=mix(bg, GREY, kk))
        d.text((W - 250, y - 6), b, font=F("TRegular", 40), fill=mix(bg, WHITE, kk), anchor="ra")

def s_years(img, d, tb, T):
    bg = WHITE; img.paste(bg, (0, 0, W, H))
    p = ease(tb / max(2.0, T * 0.55))
    yr = int(1993 + 33 * p)
    text_fade(d, (CX, 430), str(yr), F("DSemiBold", 190), NAVY, bg, 1)
    x0, x1, y = 150, W - 150, 760
    d.line((x0, y, x1, y), fill=SILVER, width=3)
    d.line((x0, y, x0 + (x1 - x0) * p, y), fill=NAVY, width=5)
    for i in range(34):
        x = x0 + (x1 - x0) * i / 33
        if i / 33 <= p: d.line((x, y - (22 if i % 5 == 0 else 12), x, y), fill=NAVY, width=2)
    d.text((x0, y + 24), "1993", font=F("TRegular", 28), fill=GREY, anchor="la"); d.text((x1, y + 24), "2026", font=F("TRegular", 28), fill=GREY, anchor="ra")
    k2 = ease((tb - T * 0.3) / 0.7)
    text_fade(d, (CX, 930), "30+ godina", F("DLight", 96), NAVY, bg, k2)
    k3 = ease((tb - T * 0.45) / 0.7)
    text_fade(d, (CX, 1080), "544 naučna rada", F("DLight", 72), BLUE, bg, k3)
    d.text((CX, 1180), "pronađena u pregledu literature · HSS Journal 2025", font=F("TRegular", 26), fill=mix(bg, GREY, k3), anchor="ma")
    text_fade(d, (CX, 1380), "Kako tako mali lanac", F("DLight", 56), TEXT, bg, ease((tb - T * 0.68) / 0.6))
    text_fade(d, (CX, 1455), "nosi tako veliku poruku?", F("DSemiBold", 56), NAVY, bg, ease((tb - T * 0.8) / 0.6))

def s_precise(img, d, tb, T):
    bg = WHITE; img.paste(bg, (0, 0, W, H))
    label(d, CX, 470, "15 KARIKA", GREY, bg, ease(tb / 0.5))
    badk = ease((tb - T * 0.3) / 0.6)
    draw_chain(d, bg, 15, tb, bad=7, badk=badk)
    k = ease((tb - T * 0.68) / 0.6)
    text_fade(d, (CX, 1420), "Više nije ista molekula.", F("DSemiBold", 64), RED, bg, k)


_im = {}
def s_product(img, d, tb, T):
    if "hero" not in _im:
        im = Image.open(os.path.join(HV, "pack_v3", "zatvorena_kutija_pecat.png")).convert("RGB")
        sc = 1.12; fg = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
        bgim = im.resize((int(im.width * H / im.height), H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(90))
        bgim = bgim.resize((fg.width, H), Image.BILINEAR)
        y = (H - fg.height) // 2 + 50
        m = Image.new("L", fg.size, 255); md = ImageDraw.Draw(m)
        for i in range(220):
            v = int(255 * i / 220); md.line((0, i, fg.width, i), fill=v); md.line((0, fg.height - 1 - i, fg.width, fg.height - 1 - i), fill=v)
        bgim.paste(fg, (0, y), m); _im["hero"] = bgim
    im = _im["hero"]; p = smooth(tb / max(T, 0.1))
    z = 1.0 + 0.05 * p
    cw, ch = W / z, H / z
    x0 = (im.width - cw) * (0.82 - 0.50 * p); y0 = (im.height - ch) * 0.5
    fr = im.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.BILINEAR)
    img.paste(fr, (0, 0))
    bgc = (0xC9, 0xCC, 0xCB)
    k1 = ease((tb - T * 0.35) / 0.7); k2 = ease((tb - T * 0.62) / 0.7); k3 = ease((tb - T * 0.8) / 0.7)
    text_fade(d, (CX, 300), "Zato je", F("DLight", 66), TEXT, bgc, ease((tb - 0.2) / 0.7))
    text_fade(d, (CX, 390), "preciznost sve.", F("DSemiBold", 84), NAVY, bgc, k1)
    text_fade(d, (CX, 1580), "Rođena u Zagrebu.", F("DLight", 56), NAVY, bgc, k2)
    text_fade(d, (CX, 1655), "Proizvedena u Švicarskoj.", F("DLight", 56), NAVY, bgc, k3)
    d.text((CX, 1745), "HELVERA · prikaz ambalaže", font=F("TRegular", 26), fill=GREY, anchor="ma")

def s_next(img, d, tb, T):
    img.paste(WHITE, (0, 0, W, H))
    label(d, CX, 700, "SERIJAL · MOLEKULA", GREY, WHITE, ease(tb / 0.6))
    text_fade(d, (CX, 790), "Prati.", F("DSemiBold", 130), NAVY, WHITE, ease((tb - 0.2) / 0.6))
    text_fade(d, (CX, 1000), "Sljedeća molekula stiže uskoro.", F("TRegular", 42), TEXT, WHITE, ease((tb - 0.7) / 0.6))
    text_fade(d, (CX, 1100), "@peptidcentar", F("TMedium", 40), BLUE, WHITE, ease((tb - 1.0) / 0.6))

SC = {k[2:]: v for k, v in dict(globals()).items() if k.startswith("s_")}
DARK = {"zagreb", "name"}

def end_card(img, p):
    d = ImageDraw.Draw(img); k = ease(p * 2.2)
    spaced(d, CX, 700, "PEPTID CENTAR", F("TSemiBold", 34), mix(WHITE, NAVY, k), 9)
    lw = int(150 * k); d.line((CX - lw, 780, CX + lw, 780), fill=mix(WHITE, GREY, k), width=2)
    d.text((CX, 818), "edukativni projekat brenda", font=F("TRegular", 40), fill=mix(WHITE, TEXT, k), anchor="ma")
    if "lg" not in _im:
        lg = Image.open(os.path.join(HV, "helvera_logo.png")).convert("RGBA"); _im["lg"] = lg.resize((640, int(lg.height * 640 / lg.width)), Image.LANCZOS)
    lg = _im["lg"].copy(); a2 = ease((p - 0.18) * 2.4); lg.putalpha(lg.split()[3].point(lambda v: int(v * a2)))
    img.paste(lg, (CX - 320, 940), lg)
    d.text((CX, 1330), "Edukacija · nije medicinski savjet", font=F("TRegular", 30), fill=mix(WHITE, GREY, k), anchor="ma")

# ---------------------------------------------------------------- captions (mirni, bez karaoke okvira)
def build_subs(timing):
    subs = []
    for s, seg in zip(SCRIPT, timing):
        words = s["sub"].split(); n = len(words); chunks, cur = [], []
        for i, w in enumerate(words):
            cur.append(w)
            if len(" ".join(cur)) > 22 or w[-1] in ".,?:!":
                if len(" ".join(cur)) >= 9 or w[-1] in ".?!": chunks.append(cur); cur = []
        if cur: chunks.append(cur)
        tot = sum(len(" ".join(c)) for c in chunks); t = seg["start"]
        for c in chunks:
            dur = (seg["end"] - seg["start"]) * len(" ".join(c)) / tot
            subs.append({"start": t, "end": t + dur, "text": " ".join(c), "scene": s["scene"]}); t += dur
    return subs

def draw_caption(img, d, sb, t, dark):
    k = ease((t - sb["start"]) / 0.18)
    f = F("TMedium", 50); w = d.textlength(sb["text"], font=f); y = 1790
    if sb["scene"] == "product": y = 1790
    bg = NAVY if dark else WHITE; fg = WHITE if dark else NAVY
    if sb["scene"] in ("tools",): bg, fg = WHITE, NAVY
    pad = 30
    d.rounded_rectangle((CX - w / 2 - pad, y - 16, CX + w / 2 + pad, y + 76), radius=46, fill=mix(bg, fg, 0.06) if sb["scene"] != "product" else WHITE)
    d.text((CX, y), sb["text"], font=f, fill=mix(bg, fg, k), anchor="ma")

# ---------------------------------------------------------------- music: tiha ambijentalna podloga
def music(total, path, sr=48000):
    n = int(total * sr); t = np.arange(n) / sr; out = np.zeros(n, np.float32)
    chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (130.81, 196.0, 329.63), (196.0, 246.94, 293.66)]
    bar = 4.0
    for i in range(int(total / bar) + 1):
        a = int(i * bar * sr); b = min(n, int((i + 1) * bar * sr) + int(0.8 * sr))
        if a >= n: break
        tt = t[a:b] - i * bar; env = np.clip(tt / 1.2, 0, 1) * np.clip((bar + 0.8 - tt) / 1.2, 0, 1)
        for fq in chords[i % 4]:
            out[a:b] += (0.10 * np.sin(2 * np.pi * fq * tt) + 0.05 * np.sin(2 * np.pi * fq * 2 * tt + 0.3) + 0.06 * np.sin(2 * np.pi * fq * 0.5 * tt)) * env
        # soft pluck arpeggio
        for j, fq in enumerate(list(chords[i % 4]) + [chords[i % 4][1] * 2]):
            s0 = a + int(j * 1.0 * sr)
            if s0 >= n: break
            m = min(n - s0, int(1.6 * sr)); pt = np.arange(m) / sr
            out[s0:s0 + m] += 0.09 * np.sin(2 * np.pi * fq * 2 * pt) * np.exp(-pt * 3.2)
    fade = np.clip(t / 1.0, 0, 1) * np.clip((total - t) / 2.0, 0, 1)
    out = np.tanh(out * 1.4) * 0.5 * fade
    st = np.stack([out, np.roll(out, 240)], 1)
    w = wave.open(path, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()

def main():
    timing = json.load(open(os.path.join(B, "timing.json")))
    speech_end = timing[-1]["end"] + 0.5; total = speech_end + END
    subs = build_subs(timing)
    scenes = []
    for i, (s, seg) in enumerate(zip(SCRIPT, timing)):
        st = 0.0 if i == 0 else seg["start"] - 0.12
        scenes.append([st, s["scene"]])
    for j in range(len(scenes)): scenes[j].append(scenes[j + 1][0] if j + 1 < len(scenes) else speech_end)
    ff = subprocess.Popen(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", os.path.join(B, "video_only.mp4")], stdin=subprocess.PIPE)
    n = int(round(total * FPS)); prev = None
    for fi in range(n):
        t = fi / FPS
        frame = Image.new("RGB", (W, H), WHITE)
        if t < speech_end:
            for j, (bs, name, be) in enumerate(scenes):
                if bs <= t < be:
                    d = ImageDraw.Draw(frame); SC[name](frame, d, t - bs, be - bs)
                    d = ImageDraw.Draw(frame)
                    for sb in subs:
                        if sb["start"] <= t < sb["end"]: draw_caption(frame, d, sb, t, name in DARK); break
                    # hairline progress + wordmark
                    dark = name in DARK
                    d.rectangle((0, 0, int(W * t / speech_end), 4), fill=WHITE if dark else NAVY)
                    spaced(d, CX, 150, "PEPTID CENTAR", F("TMedium", 24), SILVER if dark else GREY, 7)
                    # crossfade at scene start
                    if j and t - bs < 0.35 and prev is not None:
                        frame = Image.blend(prev_scene_last, frame, smooth((t - bs) / 0.35))
                    break
            if fi + 1 < n:
                nt = (fi + 1) / FPS
                cur = next((j for j, (bs, _, be) in enumerate(scenes) if bs <= t < be), None)
                nxt = next((j for j, (bs, _, be) in enumerate(scenes) if bs <= nt < be), None)
                if cur != nxt: prev_scene_last = frame.copy()
            prev = True
        else:
            end_card(frame, (t - speech_end) / END)
            if t - speech_end < 0.4: frame = Image.blend(prev_scene_last, frame, smooth((t - speech_end) / 0.4))
        if t < speech_end and fi + 1 == int(round(speech_end * FPS)): prev_scene_last = frame.copy()
        ff.stdin.write(frame.tobytes())
    ff.stdin.close(); ff.wait()
    def ts(x):
        ms = int(round((x % 1) * 1000)) % 1000
        return f"{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{ms:03d}"
    with open(os.path.join(B, "titlovi.srt"), "w", encoding="utf-8") as f:
        for i, sb in enumerate(subs, 1): f.write(f"{i}\n{ts(sb['start'])} --> {ts(sb['end'])}\n{sb['text']}\n\n")
    json.dump({"total": total, "speech_end": speech_end}, open(os.path.join(B, "render_meta.json"), "w"))
    music(total, os.path.join(B, "music.wav"))
    print("frames", n, "total", round(total, 2))

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        names = [s["scene"] for s in SCRIPT]; S = Image.new("RGB", (len(names) * 216, 384 * 2))
        for i, nm in enumerate(names):
            for r, fr in enumerate((0.55, 0.95)):
                im = Image.new("RGB", (W, H), WHITE); d = ImageDraw.Draw(im); SC[nm](im, d, 5.0 * fr, 5.0); S.paste(im.resize((216, 384)), (i * 216, r * 384))
        S.save(sys.argv[2])
    else: main()

#!/usr/bin/env python3
"""Peptid Centar B09 · Faza II (edukativni luksuz): mirna HELVERA estetika, vektorske animacije, pakovanje organski u kadru.
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

def s_title(img, d, tb, T):
    img.paste(WHITE, (0, 0, W, H))
    k1 = ease(tb / 0.7); k2 = ease((tb - 0.45) / 0.7)
    text_fade(d, (CX, 720), "Peptidi", F("DSemiBold", 150), NAVY, WHITE, k1)
    text_fade(d, (CX, 900), "nisu steroidi.", F("DLight", 110), NAVY, WHITE, k2)
    lw = 160 * ease((tb - 0.9) / 0.8)
    d.line((CX - lw, 1080, CX + lw, 1080), fill=GREY, width=2)

def chain(d, pts, r, col, n=None):
    n = len(pts) if n is None else n
    for i in range(min(n, len(pts)) - 1): d.line((pts[i], pts[i + 1]), fill=col, width=4)
    for i in range(min(n, len(pts))): d.ellipse((pts[i][0] - r, pts[i][1] - r, pts[i][0] + r, pts[i][1] + r), fill=col)

def s_lang(img, d, tb, T):
    img.paste(WHITE, (0, 0, W, H))
    label(d, CX, 560, "DVA JEZIKA", GREY, WHITE, ease(tb / 0.6))
    # left: heavy block (force), right: wave line (signal)
    k = ease((tb - 0.3) / 0.8)
    s = 110 * k
    d.rounded_rectangle((CX - 250 - s, 860 - s, CX - 250 + s, 860 + s), radius=18, fill=mix(WHITE, NAVY, k))
    pts = [(CX + 90 + i * 6, 860 + 60 * math.sin(i * 0.22 + tb * 3) * k) for i in range(int(56 * ease((tb - 0.9) / 1.0)) + 1)]
    if len(pts) > 1: d.line(pts, fill=BLUE, width=6, joint="curve")
    text_fade(d, (CX - 250, 1030), "sila", F("DLight", 64), NAVY, WHITE, ease((tb - 0.6) / 0.6))
    text_fade(d, (CX + 250, 1030), "signal", F("DLight", 64), BLUE, WHITE, ease((tb - 1.3) / 0.6))
    d.line((CX, 720, CX, 1120), fill=SILVER, width=2)

def s_steroid(img, d, tb, T):
    bg = NAVY; img.paste(bg, (0, 0, W, H))
    label(d, CX, 430, "STEROID", SILVER, bg, ease(tb / 0.5))
    text_fade(d, (CX, 490), "sila", F("DSemiBold", 130), WHITE, bg, ease((tb - 0.15) / 0.6))
    cx, cy, r = CX, 980, 290
    cell(d, cx, cy, r, bg, SILVER, True, ease((tb - 0.3) / 0.6))
    # molecule travels from outside-left, through membrane, into nucleus
    t0 = T * 0.28; p = smooth((tb - t0) / max(1.2, T * 0.42))
    if tb > t0:
        x = cx - 520 + (520) * p; y = cy - 120 * (1 - p) ** 2
        rr = 34
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=WHITE)
        for i in range(1, 5):
            q = max(0, p - i * 0.03); xx = cx - 520 + 520 * q; yy = cy - 120 * (1 - q) ** 2
            d.ellipse((xx - rr + i * 6, yy - rr + i * 6, xx + rr - i * 6, yy + rr - i * 6), fill=mix(bg, WHITE, 0.35 - i * 0.06))
    a = ease((tb - t0 - max(1.2, T * 0.42)) / 0.6)
    if a > 0:
        nr = r * 0.34
        for q in range(3):
            rad = nr + (20 + q * 26) * a
            d.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), outline=mix(bg, RED, a * (0.9 - q * 0.25)), width=4)
        label(d, CX, cy + r + 60, "MIJENJA RAD JEZGRA", WHITE, bg, a)
    label(d, CX - 330, cy - r - 70, "ćelija", GREY, bg, ease((tb - 0.5) / 0.5)) if False else None

def s_peptide(img, d, tb, T):
    bg = WHITE; img.paste(bg, (0, 0, W, H))
    label(d, CX, 430, "PEPTID", GREY, bg, ease(tb / 0.5))
    text_fade(d, (CX, 490), "signal", F("DSemiBold", 130), BLUE, bg, ease((tb - 0.15) / 0.6))
    cx, cy, r = CX, 980, 290
    cell(d, cx, cy, r, bg, NAVY, True, ease((tb - 0.3) / 0.6))
    # receptor on the surface (top-left)
    ang = math.radians(215); rx, ry = cx + r * math.cos(ang), cy + r * math.sin(ang)
    d.line((rx, ry, rx - 34, ry - 24), fill=NAVY, width=8); d.arc((rx - 78, ry - 68, rx - 18, ry - 8), 100, 330, fill=NAVY, width=8)
    t1 = T * 0.22; dur = max(1.0, T * 0.25); p = smooth((tb - t1) / dur)
    t2 = t1 + dur; t3 = T * 0.78
    dis = ease((tb - t3) / 0.9)
    if tb > t1:
        # chain of 9 beads approaching the receptor
        hx, hy = rx - 48 - 380 * (1 - p), ry - 38 - 150 * (1 - p)
        for i in range(9):
            bx = hx - i * 30 - dis * (40 + i * 22) * math.cos(i * 1.7); by = hy - i * 16 * math.sin(i * 0.9 + 1) - 10 * i + dis * (30 + i * 18) * math.sin(i * 2.1)
            col = mix(bg, BLUE, 1 - dis * 0.75)
            if i and dis < 0.15:
                pbx = hx - (i - 1) * 30; pby = hy - (i - 1) * 16 * math.sin((i - 1) * 0.9 + 1) - 10 * (i - 1)
                d.line((pbx, pby, bx, by), fill=col, width=4)
            rr = 13 * (1 - dis * 0.4)
            d.ellipse((bx - rr, by - rr, bx + rr, by + rr), fill=col)
    if tb > t2:
        # signal ripples from receptor inward to nucleus
        for q in range(4):
            ph = ((tb - t2) * 0.55 + q / 4) % 1
            x = rx + (cx - rx) * ph; y = ry + (cy - ry) * ph
            rad = 10 + 16 * math.sin(ph * math.pi)
            d.ellipse((x - rad, y - rad, x + rad, y + rad), outline=mix(bg, BLUE, 1 - ph * 0.6), width=4)
        label(d, CX, cy + r + 60, "PREDA PORUKU", NAVY, bg, ease((tb - t2) / 0.6) * (1 - dis))
    label(d, CX, cy + r + 60, "I RAZGRADI SE", BLUE, bg, dis)

def hammer(d, cx, cy, s, col):
    d.rounded_rectangle((cx - 16 * s, cy - 60 * s, cx + 16 * s, cy + 190 * s), radius=10 * s, fill=col)
    d.rounded_rectangle((cx - 110 * s, cy - 120 * s, cx + 110 * s, cy - 30 * s), radius=14 * s, fill=col)

def key(d, cx, cy, s, col, bg):
    d.ellipse((cx - 70 * s, cy - 130 * s, cx + 70 * s, cy + 10 * s), fill=col)
    d.ellipse((cx - 30 * s, cy - 90 * s, cx + 30 * s, cy - 30 * s), fill=bg)
    d.rectangle((cx - 13 * s, cy, cx + 13 * s, cy + 190 * s), fill=col)
    d.rectangle((cx + 13 * s, cy + 120 * s, cx + 52 * s, cy + 144 * s), fill=col)
    d.rectangle((cx + 13 * s, cy + 164 * s, cx + 40 * s, cy + 188 * s), fill=col)

def s_tools(img, d, tb, T):
    img.paste(NAVY, (0, 0, W, H // 2)); img.paste(WHITE, (0, H // 2, W, H))
    k1 = ease(tb / 0.6); k2 = ease((tb - T * 0.45) / 0.6)
    hammer(d, CX, 520 - 30 * (1 - k1), 1.0, mix(NAVY, WHITE, k1))
    text_fade(d, (CX, 760), "sila", F("DLight", 70), SILVER, NAVY, k1)
    key(d, CX, 1270 + 30 * (1 - k2), 1.0, mix(WHITE, BLUE, k2), WHITE)
    text_fade(d, (CX, 1500), "signal", F("DLight", 70), BLUE, WHITE, k2)

def s_body(img, d, tb, T):
    bg = WHITE; img.paste(bg, (0, 0, W, H))
    label(d, CX, 430, "TVOJE TIJELO IH PRAVI SAMO", GREY, bg, ease(tb / 0.6))
    rows = [("Inzulin", 51, T * 0.38), ("Oksitocin", 9, T * 0.52), ("GLP-1", 30, T * 0.66)]
    for i, (nm, n, t0) in enumerate(rows):
        k = ease((tb - t0) / 0.7); y = 640 + i * 260
        if k <= 0: continue
        text_fade(d, (150, y), nm, F("DSemiBold", 84), NAVY, bg, k, anchor="la")
        d.text((W - 150, y + 26), f"{n} aminokiselina", font=F("TRegular", 34), fill=mix(bg, TEXT, k), anchor="ra")
        m = int(min(n, 26) * ease((tb - t0) / 1.2))
        for j in range(m):
            x = 156 + j * 30; yy = y + 150 + 8 * math.sin(j * 0.8 + tb * 2)
            d.ellipse((x - 9, yy - 9, x + 9, yy + 9), fill=BLUE if j % 2 else NAVY)
        d.line((150, y + 205, W - 150, y + 205), fill=mix(bg, SILVER, k), width=2)
    text_fade(d, (CX, 1440), "Sve su to peptidi.", F("DLight", 64), NAVY, bg, ease((tb - T * 0.82) / 0.6))

_im = {}
def s_product(img, d, tb, T):
    if "hero" not in _im:
        im = Image.open(os.path.join(HV, "pack", "hero_kutija_bocica.jpg")).convert("RGB")
        sc = H / im.height * 1.12
        _im["hero"] = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
    im = _im["hero"]; p = smooth(tb / max(T, 0.1))
    # slow pan from the box toward the vial, slight push-in
    z = 1.0 + 0.06 * p
    cw, ch = W / z, H / z
    x0 = (im.width - cw) * (0.38 + 0.50 * p); y0 = (im.height - ch) * 0.52
    fr = im.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.BILINEAR)
    img.paste(fr, (0, 0))
    bgc = (0xD4, 0xD4, 0xD3)
    k1 = ease((tb - T * 0.35) / 0.7); k2 = ease((tb - T * 0.62) / 0.7); k3 = ease((tb - T * 0.8) / 0.7)
    text_fade(d, (CX, 300), "Ne koliko jako.", F("DLight", 66), TEXT, bgc, ease((tb - 0.2) / 0.7) * (1 - k1 * 0.0))
    text_fade(d, (CX, 390), "Koliko tačno.", F("DSemiBold", 84), NAVY, bgc, k1)
    text_fade(d, (CX, 1500), "Čista molekula.", F("DLight", 56), NAVY, bgc, k2)
    text_fade(d, (CX, 1575), "Tačna poruka.", F("DLight", 56), NAVY, bgc, k3)
    d.text((CX, 1700), "prikaz pakovanja · uskoro", font=F("TRegular", 26), fill=GREY, anchor="ma")

def s_save(img, d, tb, T):
    img.paste(WHITE, (0, 0, W, H))
    k = ease(tb / 0.6)
    cx, y = CX, 700; h = 190
    d.polygon([(cx - 62, y), (cx + 62, y), (cx + 62, y + h), (cx, y + h * 0.72), (cx - 62, y + h)], outline=mix(WHITE, NAVY, k), fill=mix(WHITE, NAVY, ease((tb - 0.8) / 0.5)))
    d.line([(cx - 62, y), (cx + 62, y), (cx + 62, y + h), (cx, y + h * 0.72), (cx - 62, y + h), (cx - 62, y)], fill=mix(WHITE, NAVY, k), width=5)
    text_fade(d, (CX, 980), "Sačuvaj.", F("DSemiBold", 110), NAVY, WHITE, ease((tb - 0.3) / 0.6))
    text_fade(d, (CX, 1130), "Za sljedeći put kad ih neko pomiješa.", F("TRegular", 40), TEXT, WHITE, ease((tb - 0.7) / 0.6))

SC = {k[2:]: v for k, v in dict(globals()).items() if k.startswith("s_")}
DARK = {"steroid"}

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

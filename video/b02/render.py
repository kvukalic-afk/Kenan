#!/usr/bin/env python3
"""Peptid Centar B02 · motion-graphics renderer (palette B, logo, word-synced captions, particles, kinetic beats).
Reads build/timing.json (sentence + word timings), writes build/video_only.mp4, build/titlovi.srt, build/render_meta.json."""
import json, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from script import SCRIPT
B = os.path.join(HERE, "build")
W, H, FPS = 1080, 1920, 30
FXB = os.path.join(HERE, "..", "fonts", "Manrope-ExtraBold.ttf")
FIN = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
LOGO = os.path.join(HERE, "..", "brand", "logo_avatar_1080.png")
BG = (0x0B, 0x1F, 0x3A); BG2 = (0x10, 0x2A, 0x4C); TXT = (0xFF, 0xFF, 0xFF); ACC = (0x19, 0xB5, 0xB0)
SOFT = (0x8A, 0x97, 0xA6); DIM = (0x2C, 0x45, 0x66); INK = (0x06, 0x12, 0x24); WARN = (0xF2, 0xB8, 0x4B)
SAFE_L, SAFE_R = 70, 140
GCX = (SAFE_L + W - SAFE_R) // 2
LY, LH = 300, 840          # graphics layer on screen
END_CARD = 1.8

_fc = {}
def F(p, s):
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, int(s))
    return _fc[(p, s)]
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def back(t, s=1.7):
    t = max(0.0, min(1.0, t)); t -= 1; return 1 + t * t * ((s + 1) * t + s)
def mix(a, b, t): t = max(0.0, min(1.0, t)); return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def ap(tb, at, d=0.35): return ease((tb - at) / d)
def ct(d, x, y, s, f, c, anchor="ma"): d.text((x, y), s, font=f, fill=c, anchor=anchor)
SFX = []
def sfx(kind): SFX.append((None, kind))

# ------------------------------------------------------------------ background: drifting particle network
random.seed(4)
PTS = [(random.uniform(0, W), random.uniform(0, H), random.uniform(-14, 14), random.uniform(-10, 10), random.uniform(2, 5)) for _ in range(46)]
def background(t):
    img = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(img)
    ps = [((x + vx * t) % W, (y + vy * t) % H, r) for x, y, vx, vy, r in PTS]
    for i in range(len(ps)):
        for j in range(i + 1, len(ps)):
            dx, dy = ps[i][0] - ps[j][0], ps[i][1] - ps[j][1]
            dd = dx * dx + dy * dy
            if dd < 190 ** 2:
                d.line((ps[i][0], ps[i][1], ps[j][0], ps[j][1]), fill=mix(BG, DIM, 1 - math.sqrt(dd) / 190), width=2)
    for x, y, r in ps:
        d.ellipse((x - r, y - r, x + r, y + r), fill=mix(BG, ACC, 0.35))
    return img

# ------------------------------------------------------------------ primitives
def chain(d, cx, cy, s, k, n=7, col=ACC, t=0.0):
    pts = []
    for i in range(n):
        x = cx + (i - (n - 1) / 2) * 92 * s
        y = cy + (36 * s if i % 2 else -36 * s) + 6 * s * math.sin(t * 2 + i)
        pts.append((x, y))
    for i in range(1, n):
        a = ease(k * n * 0.6 - i * 0.6 + 0.6)
        if a > 0:
            (x0, y0), (x1, y1) = pts[i - 1], pts[i]
            d.line((x0, y0, x0 + (x1 - x0) * a, y0 + (y1 - y0) * a), fill=mix(BG, col, 0.8), width=int(8 * s))
    for i, (x, y) in enumerate(pts):
        a = back(k * n * 0.6 - i * 0.6)
        if a > 0:
            r = 26 * s * min(1.1, a)
            d.ellipse((x - r, y - r, x + r, y + r), fill=col)
            d.ellipse((x - r * 0.45, y - r * 0.45, x + r * 0.1, y + r * 0.1), fill=mix(col, TXT, 0.45))

def pill(d, x, y, text, f, k, fg=TXT, bg=BG2, outline=None, center=False):
    if k <= 0: return 0
    w = d.textlength(text, font=f) + 70; h = f.size + 46
    if center: x = x - w / 2
    yy = y + (1 - k) * 34
    d.rounded_rectangle((x, yy, x + w, yy + h), radius=h / 2, fill=mix(BG, bg, k), outline=mix(BG, outline, k) if outline else None, width=4)
    d.text((x + 35, yy + 20), text, font=f, fill=mix(BG, fg, k))
    return w

def lock(d, cx, cy, s, on, k):
    col = ACC if on else DIM
    a = back(k)
    if a <= 0: return
    w, h = 120 * s * a, 100 * s * a
    d.arc((cx - 42 * s * a, cy - 95 * s * a, cx + 42 * s * a, cy - 10 * s * a), 180, 360, fill=col, width=int(14 * s))
    d.line((cx - 42 * s * a, cy - 52 * s * a, cx - 42 * s * a, cy - 20 * s * a), fill=col, width=int(14 * s))
    d.line((cx + 42 * s * a, cy - 52 * s * a, cx + 42 * s * a, cy - (30 if on else 20) * s * a), fill=col, width=int(14 * s))
    d.rounded_rectangle((cx - w / 2, cy - 20 * s * a, cx + w / 2, cy - 20 * s * a + h), radius=int(18 * s), fill=col)
    d.ellipse((cx - 12 * s * a, cy + 15 * s * a, cx + 12 * s * a, cy + 39 * s * a), fill=BG)

def ring(d, cx, cy, r, k, col=ACC, w=10):
    if k <= 0: return
    d.arc((cx - r, cy - r, cx + r, cy + r), -90, -90 + 360 * k, fill=col, width=w)

# ------------------------------------------------------------------ beats  fn(d, L, k, tb, T)
def b_hook(d, L, k, tb, T):
    ct(d, GCX, 0, "NOVI PEPTID", F(FXB, 64), TXT)
    ct(d, GCX, 76, "O KOJEM PRIČA SVIJET", F(FXB, 64), ACC)
    p = ease((tb - 0.05) / max(0.6, T * 0.8))
    v = int(round(25 * p))
    sc = 1 + 0.06 * math.sin(min(1, tb / 0.6) * math.pi)
    ct(d, GCX, 210, f"−{v}%", F(FXB, 300 * sc), ACC)
    bw = 560
    d.rounded_rectangle((GCX - bw / 2, 560, GCX + bw / 2, 580), radius=10, fill=DIM)
    d.rounded_rectangle((GCX - bw / 2, 560, GCX - bw / 2 + max(20, bw * p), 580), radius=10, fill=ACC)
    ct(d, GCX, 620, "tjelesne težine", F(FXB, 58), TXT)
    if int(tb * 14) != int((tb - 1 / FPS) * 14) and p < 1: sfx("tick")

def b_study(d, L, k, tb, T):
    ct(d, GCX, 120, "−25%", F(FXB, 230), ACC)
    ct(d, GCX, 380, "u prosjeku · najnovija studija", F(FIN, 44), SOFT)
    pill(d, GCX, 520, "NEJM · novembar 2026", F(FXB, 52), ap(tb, 0.5), TXT, BG2, ACC, center=True)
    chain(d, GCX, 730, 0.75, ap(tb, 0.9, 1.2), t=tb)

def b_name(d, L, k, tb, T):
    chain(d, GCX, 250, 1.0, ease(tb / 1.0), 7, ACC, tb)
    a = ap(tb, 0.35)
    ct(d, GCX, 420 + (1 - a) * 30, "RETATRUTID", F(FXB, 120), mix(BG, TXT, a))
    ct(d, GCX, 570, "trostruki agonist", F(FXB, 52), mix(BG, ACC, ap(tb, 0.7)))

def b_buttons(d, L, k, tb, T):
    ct(d, GCX, 60, "NE 1 DUGME…", F(FXB, 76), mix(BG, SOFT, ap(tb, 0)))
    for i in range(3):
        a = back((tb - 0.35 - i * 0.22) / 0.35)
        if a <= 0: continue
        if abs(tb - 0.35 - i * 0.22) < 0.5 / FPS: sfx("pop")
        x = GCX + (i - 1) * 270; y = 420; r = 105 * min(1.1, a)
        d.ellipse((x - r, y - r + 16, x + r, y + r + 16), fill=mix(BG, (0x0E, 0x6E, 0x6B), 1))
        d.ellipse((x - r, y - r, x + r, y + r), fill=ACC)
        ct(d, x, y - 55, str(i + 1), F(FXB, 110), BG)
    ct(d, GCX, 600, "…NEGO TRI", F(FXB, 96), mix(BG, ACC, ap(tb, 0.9)))

def b_gens(d, L, k, tb, T):
    rows = [("1. generacija", 1, 0.0), ("2. generacija", 2, 0.30), ("NOVI", 3, 0.52)]
    labels = ["GLP-1", "GIP", "glukagon"]
    for r, (name, n, frac) in enumerate(rows):
        at = frac * T
        a = ap(tb, at, 0.4)
        if a <= 0: continue
        if abs(tb - at) < 0.5 / FPS and r: sfx("pop")
        y = 10 + r * 225
        hi = r == 2
        d.rounded_rectangle((SAFE_L + 20, y, W - SAFE_R - 20, y + 195), radius=34, fill=mix(BG, BG2 if not hi else (0x0D, 0x3B, 0x52), a), outline=mix(BG, ACC if hi else DIM, a), width=4)
        d.text((SAFE_L + 60, y + 30), name, font=F(FXB, 50 if not hi else 58), fill=mix(BG, ACC if hi else TXT, a))
        d.text((SAFE_L + 60, y + 110), f"{n} hormon" + ("a" if n > 1 else ""), font=F(FIN, 42), fill=mix(BG, SOFT, a))
        for j in range(3):
            lock(d, W - SAFE_R - 330 + j * 120, y + 95, 0.62, j < n, ap(tb, at + 0.1 + j * 0.08, 0.3))
    if tb > 0.72 * T:
        a = ap(tb, 0.72 * T, 0.3)
        for j, lab in enumerate(labels):
            pill(d, SAFE_L + 30 + j * 280, 700, lab, F(FXB, 40), a, BG, ACC)

def icon_plate(d, x, y, s, c):
    d.ellipse((x - 70 * s, y - 70 * s, x + 70 * s, y + 70 * s), outline=c, width=int(10 * s))
    d.ellipse((x - 38 * s, y - 38 * s, x + 38 * s, y + 38 * s), outline=c, width=int(7 * s))
    d.line((x - 110 * s, y - 60 * s, x - 110 * s, y + 70 * s), fill=c, width=int(10 * s))
    d.line((x + 110 * s, y - 60 * s, x + 110 * s, y + 70 * s), fill=c, width=int(10 * s))
def icon_drop(d, x, y, s, c):
    d.polygon([(x, y - 85 * s), (x - 52 * s, y - 5 * s), (x + 52 * s, y - 5 * s)], fill=c)
    d.ellipse((x - 58 * s, y - 40 * s, x + 58 * s, y + 70 * s), fill=c)
def icon_flame(d, x, y, s, c, t=0):
    w = 1 + 0.06 * math.sin(t * 9)
    d.polygon([(x, y - 95 * s * w), (x + 55 * s, y - 10 * s), (x + 50 * s, y + 45 * s), (x, y + 75 * s), (x - 50 * s, y + 45 * s), (x - 55 * s, y - 10 * s)], fill=c)
    d.polygon([(x, y - 20 * s), (x + 25 * s, y + 25 * s), (x, y + 60 * s), (x - 25 * s, y + 25 * s)], fill=BG2)
def icon_knee(d, x, y, s, c):
    d.line((x - 20 * s, y - 90 * s, x + 10 * s, y), fill=c, width=int(26 * s)); d.line((x + 10 * s, y, x - 15 * s, y + 90 * s), fill=c, width=int(26 * s))
    d.ellipse((x - 12 * s, y - 28 * s, x + 44 * s, y + 28 * s), fill=c)
def icon_moon(d, x, y, s, c):
    d.ellipse((x - 70 * s, y - 70 * s, x + 70 * s, y + 70 * s), fill=c); d.ellipse((x - 30 * s, y - 90 * s, x + 95 * s, y + 35 * s), fill=BG2)
    ct(d, x + 75 * s, y - 95 * s, "z", F(FXB, 50 * s), c); ct(d, x + 110 * s, y - 140 * s, "z", F(FXB, 36 * s), c)

def card(d, x, y, w, h, k, hi=False):
    d.rounded_rectangle((x, y + (1 - k) * 40, x + w, y + h + (1 - k) * 40), radius=36, fill=mix(BG, BG2, k), outline=mix(BG, ACC if hi else DIM, k), width=4)

def b_keys(d, L, k, tb, T):
    items = [("SITOST", icon_plate), ("ŠEĆER", icon_drop), ("ENERGIJA", icon_flame)]
    for i, (lab, fn) in enumerate(items):
        at = 0.25 + i * (T * 0.22)
        a = back((tb - at) / 0.4)
        if a <= 0: continue
        if abs(tb - at) < 0.5 / FPS: sfx("pop")
        x = SAFE_L + 20 + i * 293; y = 120
        card(d, x, y, 270, 470, min(1, a), True)
        oy = (1 - min(1, a)) * 40
        if fn is icon_flame: fn(d, x + 135, y + 190 + oy, 0.9, ACC, tb)
        else: fn(d, x + 135, y + 190 + oy, 0.9, ACC)
        ct(d, x + 135, y + 360 + oy, lab, F(FXB, 40), TXT)
    ct(d, GCX, 680, "3 ključa · 1 molekula", F(FXB, 56), mix(BG, ACC, ap(tb, T * 0.75)))

def b_journal(d, L, k, tb, T):
    a = min(1, back(tb / 0.45)); oy = (1 - a) * 60
    d.rounded_rectangle((GCX - 290, 60 + oy, GCX + 290, 600 + oy), radius=28, fill=mix(BG, BG2, a), outline=mix(BG, ACC, a), width=5)
    ct(d, GCX, 100 + oy, "NEJM", F(FXB, 120), mix(BG, TXT, a))
    ct(d, GCX, 250 + oy, "recenzirana studija", F(FIN, 40), mix(BG, SOFT, a))
    for i in range(4):
        ww = 420 if i % 2 else 340
        d.rounded_rectangle((GCX - 210, 330 + oy + i * 52, GCX - 210 + ww, 350 + oy + i * 52), radius=10, fill=mix(BG, DIM, a))
    ct(d, GCX, 670, "novembar 2026", F(FXB, 56), mix(BG, ACC, ap(tb, 0.4)))

def b_chips(d, L, k, tb, T):
    items = [("2339 ljudi", ACC), ("80 sedmica", TXT), ("randomizirana", TXT), ("dvostruko slijepa", TXT), ("vs. placebo", TXT)]
    for i, (s, c) in enumerate(items):
        at = i * 0.2
        a = back((tb - at) / 0.35)
        if abs(tb - at) < 0.5 / FPS: sfx("pop")
        pill(d, SAFE_L + 30, 30 + i * 150, s, F(FXB, 62), min(1, a), c, BG2, ACC if i < 2 else DIM)

def b_bars(d, L, k, tb, T):
    p = ease((tb - 0.25) / max(0.8, T * 0.55))
    base = 140; maxh = 450
    for i, (lab, val, col) in enumerate([("placebo", 3.9, SOFT), ("najjača grupa", 25.0, ACC)]):
        x = GCX - 190 + i * 300; h = maxh * (val / 25.0) * p
        d.rounded_rectangle((x - 95, base, x + 95, base + max(8, h)), radius=24, fill=col)
        v = val * p
        ct(d, x, base + max(8, h) + 18, ("−" + f"{v:.1f}".replace(".", ",") + "%") if i == 0 else f"−{v:.0f}%", F(FXB, 76 if i else 56), col)
        ct(d, x, 60, lab, F(FXB, 44), TXT if i else SOFT)
    if int(tb * 14) != int((tb - 1 / FPS) * 14) and p < 1 and tb > 0.25: sfx("tick")
    if abs(tb - (0.25 + max(0.8, T * 0.55))) < 0.5 / FPS: sfx("ding")
    ct(d, GCX, 790, "80 sedmica · % tjelesne težine", F(FIN, 38), SOFT)

def b_bonus(d, L, k, tb, T):
    ct(d, GCX, 20, "BONUS", F(FXB, 90), mix(BG, ACC, ap(tb, 0)))
    for i, (lab, sub, fn, at) in enumerate([("manje bolova", "u koljenima", icon_knee, 0.35), ("manje prekida", "disanja u snu", icon_moon, T * 0.5)]):
        a = back((tb - at) / 0.4)
        if a <= 0: continue
        if abs(tb - at) < 0.5 / FPS: sfx("pop")
        y = 160 + i * 330
        card(d, SAFE_L + 20, y, W - SAFE_L - SAFE_R - 40, 290, min(1, a), True)
        oy = (1 - min(1, a)) * 40
        fn(d, SAFE_L + 170, y + 145 + oy, 0.95, ACC)
        d.text((SAFE_L + 320, y + 75 + oy), lab, font=F(FXB, 58), fill=TXT)
        d.text((SAFE_L + 320, y + 155 + oy), sub, font=F(FIN, 44), fill=SOFT)

def b_status(d, L, k, tb, T):
    a = back(tb / 0.4)
    pill(d, GCX, 30, "U ISPITIVANJU · još nije odobren", F(FXB, 44), min(1, a), BG, WARN, center=True)
    ct(d, GCX, 200, "SKALA DOKAZA", F(FXB, 56), TXT)
    size, gap = 100, 34; total = 5 * size + 4 * gap; x0 = GCX - total / 2
    for i in range(5):
        b = back((tb - 0.4 - i * 0.15) / 0.3)
        x = x0 + i * (size + gap)
        d.ellipse((x, 300, x + size, 300 + size), outline=ACC if i < 4 else DIM, width=6)
        if i < 4 and b > 0:
            r = size / 2 * min(1, b); c = (x + size / 2, 350)
            d.ellipse((c[0] - r, c[1] - r, c[0] + r, c[1] + r), fill=ACC)
            if abs(tb - 0.4 - i * 0.15) < 0.5 / FPS: sfx("tick")
    ct(d, GCX, 450, "4 · velika kontrolisana studija na ljudima", F(FXB, 42), mix(BG, ACC, ap(tb, 1.1)))
    pr = (tb * 0.7) % 1.0
    for q in range(3):
        pp = (pr + q / 3) % 1.0
        r = 60 + 260 * pp
        d.ellipse((GCX - r, 720 - r * 0.35, GCX + r, 720 + r * 0.35), outline=mix(BG, ACC, 1 - pp), width=4)
    d.ellipse((GCX - 22, 698, GCX + 22, 742), fill=ACC)

_logo = {}
def logo_img(size):
    if size not in _logo:
        im = Image.open(LOGO).convert("RGB").resize((size, size), Image.LANCZOS)
        m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 4, size * 4), fill=255)
        im.putalpha(m.resize((size, size), Image.LANCZOS)); _logo[size] = im
    return _logo[size]

def b_cta(d, L, k, tb, T):
    a = back(tb / 0.45)
    sz = int(300 * min(1.05, max(0.05, a)))
    lg = logo_img(max(8, sz)); L.paste(lg, (GCX - sz // 2, 40 + (300 - sz) // 2), lg)
    ct(d, GCX, 400, "SAČUVAJ", F(FXB, 110), mix(BG, TXT, ap(tb, 0.2)))
    ct(d, GCX, 540, "+ prati @peptidcentar", F(FXB, 56), mix(BG, ACC, ap(tb, 0.5)))

BEATS = {k[2:]: v for k, v in dict(globals()).items() if k.startswith("b_")}

# ------------------------------------------------------------------ captions (word synced)
def build_subs(timing):
    subs = []
    for s, seg in zip(SCRIPT, timing):
        disp = s["sub"].split(); sw = seg["words"]; nd, ns = len(disp), len(sw)
        starts = [sw[min(ns - 1, round(i * (ns - 1) / max(1, nd - 1)))]["s"] for i in range(nd)]
        chunks, cur = [], []
        for i, w in enumerate(disp):
            if cur and (len(" ".join(disp[j] for j in cur + [i])) > 16 or len(cur) >= 3):
                chunks.append(cur); cur = []
            cur.append(i)
            if w[-1] in ".,?:!": chunks.append(cur); cur = []
        if cur: chunks.append(cur)
        for ci, c in enumerate(chunks):
            st = starts[c[0]]; en = starts[chunks[ci + 1][0]] if ci + 1 < len(chunks) else seg["end"] + 0.12
            subs.append({"start": st - 0.04, "end": en - 0.01, "words": [disp[j] for j in c], "acc": s["acc"]})
    return subs

def draw_caption(d, sb, t):
    k = back((t - sb["start"]) / 0.14, 1.4)
    f = F(FXB, 86 * (0.9 + 0.1 * min(1, k)))
    line = " ".join(sb["words"]); w = d.textlength(line, font=f)
    x = GCX - w / 2; y = 1290
    for wd in sb["words"]:
        d.text((x, y), wd, font=f, fill=ACC if wd in sb["acc"] else TXT, stroke_width=8, stroke_fill=INK)
        x += d.textlength(wd + " ", font=f)

def draw_logo(img, a):
    lg = logo_img(80).copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v * a)))
    img.paste(lg, (SAFE_L, 222), lg)
    d = ImageDraw.Draw(img); d.text((SAFE_L + 96, 244), "Peptid Centar", font=F(FXB, 34), fill=mix(BG, TXT, a))

def end_card(img, p):
    d = ImageDraw.Draw(img); k = ease(p * 3)
    lg = logo_img(360).copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v * k))); img.paste(lg, (GCX - 180, 480), lg)
    ct(d, GCX, 900, "Peptidi bez hajpa", F(FXB, 64), mix(BG, ACC, k))
    ct(d, GCX, 1000, "@peptidcentar", F(FXB, 48), mix(BG, TXT, k))
    ct(d, GCX, 1180, "Edukacija · nije medicinski savjet", F(FIN, 40), mix(BG, SOFT, k))

def main():
    timing = json.load(open(os.path.join(B, "timing.json")))
    speech_end = timing[-1]["end"] + 0.3; total = speech_end + END_CARD
    subs = build_subs(timing)
    beats = []
    for i, (s, seg) in enumerate(zip(SCRIPT, timing)):
        for j, (name, frac) in enumerate(s["beats"]):
            bs = 0.0 if (i == 0 and j == 0) else seg["start"] + frac * (seg["end"] - seg["start"]) - 0.1
            beats.append([bs, name])
    for j in range(len(beats)): beats[j].append(beats[j + 1][0] if j + 1 < len(beats) else speech_end)
    for bs, _, _ in beats[1:]: SFX.append((bs, "whoosh"))
    SFX.append((speech_end, "whoosh"))
    ff = subprocess.Popen(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", os.path.join(B, "video_only.mp4")], stdin=subprocess.PIPE)
    n = int(round(total * FPS)); logo_at = beats[1][0]
    for fi in range(n):
        t = fi / FPS
        img = background(t)
        if t < speech_end:
            for bs, name, be in beats:
                if bs <= t < be:
                    tb, T = t - bs, be - bs
                    L = Image.new("RGB", (W, LH), BG)
                    L.paste(img.crop((0, LY, W, LY + LH)))
                    n0 = len(SFX)
                    BEATS[name](ImageDraw.Draw(L), L, ease(tb / 0.6), tb, T)
                    for q in range(n0, len(SFX)):
                        if SFX[q][0] is None: SFX[q] = (t, SFX[q][1])
                    intro = 1.0 if bs == 0 else ease(tb / 0.2)
                    sc = (0.92 + 0.08 * intro) * (1 + 0.03 * min(1, tb / max(1, T)))
                    if abs(sc - 1) > 1e-3:
                        Ls = L.resize((int(W * sc), int(LH * sc)), Image.BILINEAR)
                        cx0, cy0 = (Ls.width - W) // 2, (Ls.height - LH) // 2
                        if sc >= 1: L = Ls.crop((cx0, cy0, cx0 + W, cy0 + LH))
                        else:
                            base = img.crop((0, LY, W, LY + LH)); base.paste(Ls, (-cx0, -cy0)); L = base
                    if intro < 1: L = Image.blend(img.crop((0, LY, W, LY + LH)), L, intro)
                    img.paste(L, (0, LY)); break
            d = ImageDraw.Draw(img)
            for sb in subs:
                if sb["start"] <= t < sb["end"]: draw_caption(d, sb, t); break
            if t >= logo_at: draw_logo(img, 0.85 * ease((t - logo_at) / 0.4))
        else:
            end_card(img, (t - speech_end) / END_CARD)
        ff.stdin.write(img.tobytes())
    ff.stdin.close(); ff.wait()
    def ts(x):
        ms = int(round((x % 1) * 1000)) % 1000
        return f"{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{ms:03d}"
    with open(os.path.join(B, "titlovi.srt"), "w", encoding="utf-8") as f:
        for i, sb in enumerate(subs, 1): f.write(f"{i}\n{ts(max(0, sb['start']))} --> {ts(sb['end'])}\n{' '.join(sb['words'])}\n\n")
    seen, clean = {}, []
    for t, kd in sorted((s for s in SFX if s[0] is not None), key=lambda x: x[0]):
        if kd in seen and t - seen[kd] < (0.06 if kd == "tick" else 0.2): continue
        seen[kd] = t; clean.append((t, kd))
    json.dump({"total": total, "speech_end": speech_end, "sfx": clean}, open(os.path.join(B, "render_meta.json"), "w"), indent=1)
    print("frames", n, "beats", len(beats), "subs", len(subs), "sfx", len(clean))

if __name__ == "__main__":
    main()

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
def card(d, x, y, w, h, k, hi=False):
    d.rounded_rectangle((x, y + (1 - k) * 40, x + w, y + h + (1 - k) * 40), radius=36, fill=mix(BG, BG2, k), outline=mix(BG, ACC if hi else DIM, k), width=4)

def mark(d, x, y, ok, s=1.0):
    if ok: d.line((x - 26 * s, y, x - 6 * s, y + 22 * s, x + 30 * s, y - 24 * s), fill=ACC, width=int(11 * s), joint="curve")
    else:
        c = (0xE5, 0x4B, 0x4B); d.line((x - 24 * s, y - 24 * s, x + 24 * s, y + 24 * s), fill=c, width=int(11 * s)); d.line((x - 24 * s, y + 24 * s, x + 24 * s, y - 24 * s), fill=c, width=int(11 * s))

def b_hook(d, L, k, tb, T):
    ct(d, GCX, 0, "SVI PRIČAJU O", F(FXB, 60), TXT)
    ct(d, GCX, 74, "NAD+ INJEKCIJAMA", F(FXB, 60), ACC)
    pr = (tb * 0.8) % 1.0
    for q in range(3):
        pp = (pr + q / 3) % 1.0; r = 170 + 230 * pp
        d.ellipse((GCX - r, 430 - r, GCX + r, 430 + r), outline=mix(BG, ACC, (1 - pp) * 0.8), width=5)
    s = 1 + 0.05 * math.sin(tb * 5)
    a = back(tb / 0.35) if tb > 0.02 else 1
    d.ellipse((GCX - 165 * a, 430 - 165 * a, GCX + 165 * a, 430 + 165 * a), fill=BG2, outline=ACC, width=8)
    ct(d, GCX, 360, "NAD+", F(FXB, 120 * s * min(1, a) + 1), TXT)
    ct(d, GCX, 690, "šta je zapravo?", F(FXB, 56), mix(BG, ACC, ap(tb, 0.6)))

def b_notpeptide(d, L, k, tb, T):
    for i, (lab, ok) in enumerate([("PEPTID", False), ("KOENZIM", True)]):
        at = 0.1 + i * T * 0.35
        a = back((tb - at) / 0.4)
        if a <= 0: continue
        if abs(tb - at) < 0.5 / FPS: sfx("pop")
        x = SAFE_L + 30 + i * 445; y = 60
        card(d, x, y, 400, 470, min(1, a), ok)
        oy = (1 - min(1, a)) * 40
        if ok:
            # ring molecule (coenzyme) icon
            for j in range(6):
                ang = j * math.pi / 3 + tb
                px, py = x + 200 + 80 * math.cos(ang), y + 190 + oy + 80 * math.sin(ang)
                d.ellipse((px - 20, py - 20, px + 20, py + 20), fill=ACC)
            d.ellipse((x + 145, y + 135 + oy, x + 255, y + 245 + oy), outline=ACC, width=8)
        else:
            chain(d, x + 200, y + 190 + oy, 0.45, 1.0, 5, SOFT, tb)
            d.line((x + 70, y + 80 + oy, x + 330, y + 300 + oy), fill=(0xE5, 0x4B, 0x4B), width=14)
        ct(d, x + 200, y + 340 + oy, lab, F(FXB, 52), ACC if ok else SOFT)
        mark(d, x + 200, y + 430 + oy, ok)
    ct(d, GCX, 640, "ima ga svaka ćelija", F(FXB, 58), mix(BG, TXT, ap(tb, T * 0.6)))

def b_cell(d, L, k, tb, T):
    a = min(1, back(tb / 0.45)); cx, cy = GCX, 400
    d.ellipse((cx - 330 * a, cy - 300 * a, cx + 330 * a, cy + 300 * a), fill=(0x0F, 0x33, 0x55), outline=ACC, width=6)
    d.ellipse((cx - 90 * a, cy - 80 * a, cx + 90 * a, cy + 80 * a), fill=(0x16, 0x45, 0x6E))
    mito = [(-200, -140, 20), (180, -150, -25), (-210, 140, -15), (190, 150, 30), (0, 210, 0)]
    for i, (dx, dy, rot) in enumerate(mito):
        on = ap(tb, 0.5 + i * 0.25, 0.25)
        x, y = cx + dx * a, cy + dy * a
        col = mix(DIM, ACC, on)
        d.rounded_rectangle((x - 70, y - 32, x + 70, y + 32), radius=32, fill=col)
        for z in range(-45, 50, 30): d.line((x + z, y - 22, x + z + 12, y + 22), fill=mix(col, BG, 0.5), width=5)
        if on > 0.9 and int(tb * 6 + i) % 2 == 0:
            bx, by = x + 70, y - 60
            d.polygon([(bx + 6, by - 30), (bx - 16, by + 4), (bx, by + 4), (bx - 6, by + 30), (bx + 16, by - 6), (bx, by - 6)], fill=WARN)
        if abs(tb - 0.5 - i * 0.25) < 0.5 / FPS: sfx("tick")
    ct(d, GCX, 740, "mitohondrije → ENERGIJA", F(FXB, 52), mix(BG, ACC, ap(tb, 0.8)))

def b_dna(d, L, k, tb, T):
    cx, top, h = GCX, 40, 560
    fix = ease((tb - 0.5) / 1.0)
    for i in range(22):
        y = top + i * h / 22; ph = tb * 2.2 + i * 0.5
        x1 = cx + 150 * math.sin(ph); x2 = cx - 150 * math.sin(ph)
        broken = i in (9, 10, 11) and fix < 1
        if broken:
            gap = 70 * (1 - fix)
            d.line((x1, y, (x1 + x2) / 2 - gap / 2, y), fill=mix(DIM, ACC, fix), width=6)
            d.line(((x1 + x2) / 2 + gap / 2, y, x2, y), fill=mix(DIM, ACC, fix), width=6)
        else:
            d.line((x1, y, x2, y), fill=mix(BG, ACC, 0.55), width=6)
        d.ellipse((x1 - 13, y - 13, x1 + 13, y + 13), fill=TXT); d.ellipse((x2 - 13, y - 13, x2 + 13, y + 13), fill=ACC)
    if abs(tb - 1.5) < 0.5 / FPS: sfx("ding")
    ct(d, GCX, 650, "POPRAVKA DNK", F(FXB, 72), mix(BG, TXT, ap(tb, 0.3)))

def b_skin(d, L, k, tb, T):
    ct(d, GCX, 0, "NAD+ u ljudskoj koži", F(FXB, 56), TXT)
    x0, x1, y0, y1 = SAFE_L + 80, W - SAFE_R - 60, 150, 560
    d.line((x0, y1, x1, y1), fill=SOFT, width=4); d.line((x0, y0, x0, y1), fill=SOFT, width=4)
    p = ease((tb - 0.3) / max(0.8, T * 0.6))
    d.line((x0 + 20, y0 + 40, x0 + 20 + (x1 - x0 - 60) * p, y0 + 40 + (y1 - y0 - 120) * p), fill=ACC, width=12)
    ex, ey = x0 + 20 + (x1 - x0 - 60) * p, y0 + 40 + (y1 - y0 - 120) * p
    d.polygon([(ex + 26, ey + 22), (ex - 14, ey + 18), (ex + 14, ey - 16)], fill=ACC)
    d.text((x0 - 10, y1 + 18), "mlađi", font=F(FXB, 42), fill=TXT)
    d.text((x1 - 140, y1 + 18), "stariji", font=F(FXB, 42), fill=TXT)
    d.text((x0 - 10, y0 - 70), "NAD+", font=F(FIN, 34), fill=SOFT)
    pill(d, GCX, 690, "49 ljudi · 0–77 godina", F(FXB, 44), ap(tb, 0.9), TXT, BG2, DIM, center=True)

def b_b3(d, L, k, tb, T):
    a = min(1, back(tb / 0.45)); cx, cy = SAFE_L + 200, 360
    d.rounded_rectangle((cx - 110 * a, cy - 190 * a, cx + 110 * a, cy + 190 * a), radius=int(110 * a) or 1, fill=WARN)
    d.rectangle((cx - 110 * a, cy, cx + 110 * a, cy + 190 * a - 110 * a), fill=(0xF6, 0xD3, 0x86))
    d.rounded_rectangle((cx - 110 * a, cy, cx + 110 * a, cy + 190 * a), radius=int(110 * a) or 1, fill=(0xF6, 0xD3, 0x86))
    ct(d, cx, cy - 75, "B3", F(FXB, 90 * a + 1), BG)
    p = ease((tb - 0.6) / 0.6)
    if p > 0:
        x0, x1 = cx + 150, cx + 150 + 200 * p
        d.line((x0, cy, x1, cy), fill=ACC, width=12); d.polygon([(x1 + 34, cy), (x1, cy - 24), (x1, cy + 24)], fill=ACC)
    b = back((tb - 1.1) / 0.4)
    if b > 0:
        if abs(tb - 1.1) < 0.5 / FPS: sfx("pop")
        x = W - SAFE_R - 170; r = 140 * min(1.05, b)
        d.ellipse((x - r, cy - r, x + r, cy + r), fill=BG2, outline=ACC, width=8)
        ct(d, x, cy - 50, "NAD+", F(FXB, 80 * min(1, b) + 1), TXT)
    ct(d, GCX, 650, "vitamin B3 → NAD+", F(FXB, 60), mix(BG, ACC, ap(tb, 0.8)))

def b_x46(d, L, k, tb, T):
    p = ease((tb - 0.3) / max(0.8, T * 0.5))
    lo = 1 + 3 * p; hi = 1 + 5 * p
    ct(d, GCX, 60, f"{lo:.0f}–{hi:.0f}×", F(FXB, 260), ACC)
    ct(d, GCX, 360, "više NAD+ u krvi", F(FXB, 60), TXT)
    for i in range(6):
        on = p * 6 > i
        x = GCX - 5 * 70 + i * 140
        d.rounded_rectangle((x - 50, 470, x + 50, 600), radius=24, fill=ACC if on else DIM)
        if on and abs(p * 6 - i - 0.02) < 0.15: sfx("tick")
    ct(d, GCX, 690, "visoke doze vitamina B3 · 2026", F(FIN, 40), SOFT)

def b_nr(d, L, k, tb, T):
    items = [("nikotinamid ribozid", ACC), ("starije osobe", TXT), ("kontrolisana studija", TXT), ("NAD+ raste", ACC), ("dobro podnošen", ACC)]
    for i, (s, c) in enumerate(items):
        at = i * min(0.6, T / 6)
        a = back((tb - at) / 0.35)
        if abs(tb - at) < 0.5 / FPS: sfx("pop")
        pill(d, SAFE_L + 30, 20 + i * 150, s, F(FXB, 58), min(1, a), c, BG2, ACC if c == ACC else DIM)

def b_summary(d, L, k, tb, T):
    items = [("ENERGIJA", "bolt"), ("POPRAVKA", "dna"), ("DUGOVJEČNOST", "inf")]
    for i, (lab, ic) in enumerate(items):
        at = 0.15 + i * T * 0.2
        a = back((tb - at) / 0.4)
        if a <= 0: continue
        if abs(tb - at) < 0.5 / FPS: sfx("pop")
        x = SAFE_L + 20 + i * 293; y = 80
        card(d, x, y, 270, 420, min(1, a), True)
        oy = (1 - min(1, a)) * 40; cx, cy = x + 135, y + 170 + oy
        if ic == "bolt": d.polygon([(cx + 10, cy - 90), (cx - 50, cy + 10), (cx - 5, cy + 10), (cx - 15, cy + 90), (cx + 50, cy - 15), (cx + 5, cy - 15)], fill=ACC)
        elif ic == "dna":
            for j in range(7):
                yy = cy - 80 + j * 27; ph = tb * 2 + j * 0.6
                d.line((cx + 45 * math.sin(ph), yy, cx - 45 * math.sin(ph), yy), fill=ACC, width=6)
        else:
            d.arc((cx - 85, cy - 40, cx + 5, cy + 40), 0, 360, fill=ACC, width=12); d.arc((cx - 5, cy - 40, cx + 85, cy + 40), 0, 360, fill=ACC, width=12)
        ct(d, cx, y + 320 + oy, lab, F(FXB, 34 if len(lab) > 9 else 40), TXT)
    ct(d, GCX, 600, "NAD+ = zvijezda", F(FXB, 70), mix(BG, ACC, ap(tb, T * 0.65)))

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

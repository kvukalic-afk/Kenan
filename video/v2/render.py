#!/usr/bin/env python3
"""Peptid Centar · V2 renderer (GHK-Cu). Kinetic graphics + word-synced subtitles.
Usage: python3 render.py   (reads build/timing.json, writes build/video_only.mp4, build/sfx.json, build/titlovi.srt)
"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from script import SCRIPT

W, H, FPS = 1080, 1920, 30
B = os.path.join(HERE, "build")
FXB = os.path.join(HERE, "..", "fonts", "Manrope-ExtraBold.ttf")
FIN = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
FIB = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"

BG = (0x1F, 0x22, 0x26); TXT = (0xF5, 0xF0, 0xE8); PANEL = (0x2E, 0x32, 0x38)
ACC = (0xB8, 0x73, 0x33); MUTED = (0x8C, 0x8F, 0x94); DIM = (0x55, 0x59, 0x5F)

SAFE_L, SAFE_R = 70, 140
LAYER_Y, LAYER_H = 270, 860          # graphics area on screen: y 270..1130
GCX = (SAFE_L + W - SAFE_R) // 2     # 505: centre of the safe area
SUB_Y0, SUB_Y1 = 1150, 1480
END_CARD = 1.8

_fc = {}
def F(path, size):
    k = (path, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def back(t, s=1.7):
    t = max(0.0, min(1.0, t)); t -= 1; return 1 + t * t * ((s + 1) * t + s)
def lerp(a, b, t): t = max(0.0, min(1.0, t)); return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def tw(d, s, f): return d.textlength(s, font=f)
def ctext(d, cx, y, s, f, fill): d.text((cx - tw(d, s, f) / 2, y), s, font=f, fill=fill)
def appear(tb, at, dur=0.35): return ease((tb - at) / dur)

SFX = []   # (time, kind)

# ------------------------------------------------------------------ icons
def molecule(d, cx, cy, s, k, pulse=0.0):
    r = 60 * s
    pts = [(cx - 225 * s, cy + 45 * s), (cx - 75 * s, cy - 40 * s), (cx + 75 * s, cy + 45 * s)]
    cu = (cx + 220 * s, cy - 50 * s)
    fl = F(FXB, int(48 * s))
    for i in range(1, 3):
        a = ease(k * 3 - i * 0.45)
        (px, py), (x, y) = pts[i - 1], pts[i]
        if a > 0: d.line((px, py, px + (x - px) * a, py + (y - py) * a), fill=MUTED, width=max(3, int(7 * s)))
    for i, (x, y) in enumerate(pts):
        a = back(k * 3 - i * 0.45)
        if a <= 0: continue
        rr = r * a
        d.ellipse((x - rr, y - rr, x + rr, y + rr), outline=TXT, width=max(3, int(6 * s)), fill=PANEL)
        if a > 0.7: ctext(d, x, y - 32 * s, "GHK"[i], fl, TXT)
    a = back(k * 3 - 1.5)
    if a > 0:
        x, y = cu
        d.line((pts[2][0], pts[2][1], pts[2][0] + (x - pts[2][0]) * min(1, a), pts[2][1] + (y - pts[2][1]) * min(1, a)), fill=ACC, width=max(3, int(7 * s)))
        if pulse > 0:
            pr = r * (1 + 0.9 * pulse)
            d.ellipse((x - pr, y - pr, x + pr, y + pr), outline=lerp(BG, ACC, 1 - pulse), width=max(2, int(5 * s)))
        rr = r * 0.95 * a
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=ACC)
        if a > 0.7: ctext(d, x, y - 32 * s, "Cu", fl, BG)

def tube(d, cx, cy, s, fill_k=1.0, liquid=ACC, outline=TXT):
    if s < 0.08: return
    w, h = 70 * s, 300 * s
    x0, y0 = cx - w / 2, cy - h / 2
    lvl = y0 + h * (1 - 0.55 * fill_k)
    if fill_k > 0.02 and lvl < y0 + h - 8 * s - 2:
        d.rounded_rectangle((x0 + 8 * s, lvl, x0 + w - 8 * s, y0 + h - 8 * s), radius=int(26 * s), fill=liquid)
    d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=int(35 * s), outline=outline, width=max(3, int(6 * s)))
    d.line((x0 - 14 * s, y0, x0 + w + 14 * s, y0), fill=outline, width=max(3, int(6 * s)))

def face(d, cx, cy, s, col=TXT, width=6):
    d.ellipse((cx - 210 * s, cy - 280 * s, cx + 210 * s, cy + 280 * s), outline=col, width=int(width * s) or 2)

def drop(d, cx, cy, s, col):
    r = 190 * s
    d.polygon([(cx, cy - r * 1.75), (cx - r * 0.88, cy - r * 0.45), (cx + r * 0.88, cy - r * 0.45)], fill=col)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)

def dots(d, cx, y, level, k, size=70, gap=44, labels=False):
    total = 5 * size + 4 * gap
    x = cx - total / 2
    for i in range(5):
        a = back(k * 2.2 - i * 0.2)
        bx = x + i * (size + gap)
        if i < level and a > 0:
            rr = size / 2 * min(1.0, a)
            c = (bx + size / 2, y + size / 2)
            d.ellipse((c[0] - rr, c[1] - rr, c[0] + rr, c[1] + rr), fill=ACC)
        d.ellipse((bx, y, bx + size, y + size), outline=ACC if i < level else DIM, width=5)

def chip(d, x, y, text, f, k, col=TXT, fill=PANEL):
    if k <= 0: return
    w = tw(d, text, f) + 64
    yy = y + (1 - k) * 30
    d.rounded_rectangle((x, yy, x + w, yy + f.size + 44), radius=int((f.size + 44) / 2), fill=lerp(BG, fill, k))
    d.text((x + 32, yy + 18), text, font=f, fill=lerp(BG, col, k))
    return w

# ------------------------------------------------------------------ beats
# each: fn(d, layer, k, tb, T) ; k = intro progress 0..1 (~0.6 s), tb = seconds since beat start, T = beat length
def b_decline(d, L, k, tb, T):
    p = ease((tb - 0.35) / max(0.5, T * 0.62))
    val = int(round(200 - 120 * p))
    big = F(FXB, 250)
    col = lerp(TXT, ACC, (p - 0.8) * 5)
    ctext(d, GCX, 0, "PEPTID KOJI S GODINAMA", F(FXB, 58), TXT)
    ctext(d, GCX, 72, "PADA ISPOD POLA", F(FXB, 58), ACC)
    ctext(d, GCX, 150, str(val), big, col)
    ctext(d, GCX, 445, "u krvi · ng/mL", F(FIN, 40), MUTED)
    x0, x1, y0, y1 = SAFE_L + 70, W - SAFE_R - 60, 545, 735
    d.line((x0, 780, x1, 780), fill=DIM, width=4)
    d.line((x0, y0, x0 + (x1 - x0) * p, y0 + (y1 - y0) * p), fill=ACC, width=10)
    d.ellipse((x0 - 14, y0 - 14, x0 + 14, y0 + 14), fill=TXT)
    if p > 0.02:
        ex, ey = x0 + (x1 - x0) * p, y0 + (y1 - y0) * p
        d.ellipse((ex - 16, ey - 16, ex + 16, ey + 16), fill=ACC)
    d.text((x0 - 20, 798), "20 god.", font=F(FXB, 44), fill=TXT)
    a = ease((p - 0.85) * 6)
    d.text((x1 - tw(d, "60 god.", F(FXB, 44)) + 20, 798), "60 god.", font=F(FXB, 44), fill=lerp(BG, ACC, a))
    if 0.35 < tb < 0.35 + T * 0.62:
        if int(tb * 10) != int((tb - 1 / FPS) * 10): SFX.append((None, "tick"))

def b_blood(d, L, k, tb, T):
    s = 0.55 + 0.45 * back(k)
    drop(d, GCX, 470, s, lerp(BG, (0x5A, 0x2A, 0x22), k))
    for j in range(7):
        ang = j * 0.9 + tb * 0.9
        x = GCX + math.cos(ang * 1.3 + j) * 110 * s
        y = 480 + math.sin(ang + j * 2) * 110 * s
        if k > 0.5: molecule(d, x, y, 0.22, 1.0)
    ctext(d, GCX, 730, "u tvojoj krvi", F(FXB, 64), lerp(BG, TXT, appear(tb, 0.2)))

def b_molecule(d, L, k, tb, T):
    pulse = (tb * 0.8) % 1.0
    molecule(d, GCX, 400, 1.45, ease(tb / 0.9), pulse if tb > 0.9 else 0)
    a = appear(tb, 0.6)
    ctext(d, GCX, 640, "GHK-Cu", F(FXB, 110), lerp(BG, ACC, a))
    ctext(d, GCX, 775, "bakreni peptid", F(FXB, 56), lerp(BG, TXT, appear(tb, 0.9)))

def b_year(d, L, k, tb, T):
    sc = 1.25 - 0.25 * ease(tb / 0.35)
    f = F(FXB, int(260 * sc))
    ctext(d, GCX, 230 - (sc - 1) * 120, "1973", f, lerp(BG, ACC, ease(tb / 0.25)))
    d.line((GCX - 260 * ease(tb / 0.6), 520, GCX + 260 * ease(tb / 0.6), 520), fill=TXT, width=6)
    ctext(d, GCX, 560, "otkriće u laboratoriji", F(FIN, 46), lerp(BG, TXT, appear(tb, 0.3)))

def b_lab(d, L, k, tb, T):
    # young plasma (tube) -> old liver tissue (cell grid) that turns "younger"
    tube(d, SAFE_L + 140, 330, 0.95, ease(tb / 0.6), (0x8A, 0x2E, 0x26))
    ctext(d, SAFE_L + 140, 520, "krv mladih", F(FXB, 40), TXT)
    a = ease((tb - 0.6) / 0.5)
    ax0, ax1 = SAFE_L + 230, SAFE_L + 230 + 150 * a
    if a > 0:
        d.line((ax0, 330, ax1, 330), fill=ACC, width=8)
        d.polygon([(ax1 + 26, 330), (ax1, 312), (ax1, 348)], fill=ACC)
    gx, gy, n, cs = SAFE_L + 450, 170, 5, 74
    conv = (tb - 1.3) / max(0.8, T - 1.8)
    for r in range(n):
        for c in range(n):
            idx = (r * 7 + c * 3) % (n * n)
            on = conv * (n * n) > idx
            col = ACC if on else DIM
            x, y = gx + c * cs, gy + r * cs
            d.rounded_rectangle((x, y, x + cs - 12, y + cs - 12), radius=18, fill=col if on else None, outline=col, width=4)
    ctext(d, gx + n * cs / 2 - 6, 560, "staro tkivo jetre", F(FXB, 40), TXT)
    ctext(d, GCX, 690, "→ proteini kao kod mlađih", F(FIN, 44), lerp(BG, ACC, appear(tb, T * 0.7)))

def b_level1(d, L, k, tb, T):
    tube(d, GCX, 280, back(k), 1.0, ACC)
    ctext(d, GCX, 470, "U EPRUVETI", F(FXB, 84), lerp(BG, TXT, appear(tb, 0.15)))
    dots(d, GCX, 610, 1, ease((tb - 0.3) / 0.9), size=64, gap=38)
    ctext(d, GCX, 710, "Skala dokaza: nivo 1 · ćelije", F(FIN, 42), lerp(BG, MUTED, appear(tb, 0.6)))

def b_faceq(d, L, k, tb, T):
    face(d, GCX, 420, 0.95 * back(k), TXT)
    q = back((tb - 0.25) / 0.45)
    if q > 0: ctext(d, GCX, 420 - 140 * q, "?", F(FXB, int(300 * min(1.1, q))), ACC)
    ctext(d, GCX, 740, "a na koži?", F(FXB, 60), lerp(BG, TXT, appear(tb, 0.4)))

def b_chips(d, L, k, tb, T):
    f = F(FXB, 58)
    items = [("40 žena", ACC), ("40–65 godina", TXT), ("8 sedmica", ACC), ("randomizirana", TXT), ("dvostruko slijepa", TXT)]
    y = 90
    for i, (s, c) in enumerate(items):
        a = back((tb - i * 0.22) / 0.4)
        if a > 0 and int((tb - i * 0.22) * FPS) == 0: SFX.append((None, "pop"))
        chip(d, SAFE_L + 30, y + i * 135, s, f, min(1, a), c)

def b_split(d, L, k, tb, T):
    cx, cy, s = GCX, 400, 1.05
    a = ease(tb / 0.5)
    tint = Image.new("RGBA", L.size, (0, 0, 0, 0)); td = ImageDraw.Draw(tint)
    td.pieslice((cx - 210 * s, cy - 280 * s, cx + 210 * s, cy + 280 * s), 90, 270, fill=ACC + (int(90 * a),))
    L.paste(Image.alpha_composite(L.convert("RGBA"), tint).convert("RGB"))
    face(d, cx, cy, s, TXT)
    d.line((cx, cy - 310 * s, cx, cy - 310 * s + 620 * s * a), fill=TXT, width=5)
    fl = F(FXB, 46)
    ctext(d, cx - 120, 735, "S PEPTIDOM", fl, lerp(BG, ACC, appear(tb, 0.4)))
    ctext(d, cx + 125, 735, "BEZ", fl, lerp(BG, MUTED, appear(tb, 0.6)))
    ctext(d, cx, 805, "isti serum, druga strana lica", F(FIN, 38), lerp(BG, MUTED, appear(tb, 0.9)))

def wave(d, x0, x1, y, amp, col, width=8, ph=0.0):
    pts = []
    for i in range(0, 121):
        x = x0 + (x1 - x0) * i / 120
        pts.append((x, y + amp * math.sin(i / 120 * math.pi * 6 + ph)))
    d.line(pts, fill=col, width=width, joint="curve")

def b_wrinkle(d, L, k, tb, T):
    p = ease((tb - 0.3) / max(0.6, T * 0.5))
    val = 55.8 * p
    s = ("−" + f"{val:.1f}".replace(".", ",") + "%")
    ctext(d, GCX, 20, s, F(FXB, 200), ACC)
    ctext(d, GCX, 250, "volumen bora", F(FXB, 52), TXT)
    x0, x1 = SAFE_L + 60, W - SAFE_R - 60
    d.text((x0, 360), "bez peptida", font=F(FIN, 38), fill=MUTED)
    wave(d, x0, x1, 470, 60, MUTED, 8, tb * 0.6)
    d.text((x0, 580), "s peptidom", font=F(FIB, 38), fill=ACC)
    wave(d, x0, x1, 690, 60 * (1 - 0.558 * p), ACC, 10, tb * 0.6)
    if 0.3 < tb < 0.3 + T * 0.5 and int(tb * 12) != int((tb - 1 / FPS) * 12): SFX.append((None, "tick"))
    if abs(tb - (0.3 + max(0.6, T * 0.5))) < 0.5 / FPS: SFX.append((None, "ding"))

def b_limits(d, L, k, tb, T):
    f = F(FXB, 56)
    rows = [("n = 40", "mala studija"), ("8 sedmica", "kratko"), ("platio proizvođač", "sukob interesa")]
    for i, (a_, b_) in enumerate(rows):
        a = ease((tb - i * 0.35) / 0.4)
        if a <= 0: continue
        y = 110 + i * 205 + (1 - a) * 30
        d.rounded_rectangle((SAFE_L + 20, y, W - SAFE_R - 20, y + 170), radius=30, fill=lerp(BG, PANEL, a))
        d.text((SAFE_L + 60, y + 26), a_, font=f, fill=lerp(BG, TXT, a))
        d.text((SAFE_L + 60, y + 102), b_, font=F(FIN, 38), fill=lerp(BG, MUTED, a))

def b_scale3(d, L, k, tb, T):
    ctext(d, GCX, 120, "SKALA DOKAZA", F(FXB, 62), TXT)
    dots(d, GCX, 270, 3, ease(tb / 1.0), size=104, gap=42)
    labs = ["1 Ćelije", "2 Životinje", "3 Ljudi, mala studija", "4 Ljudi, velika studija", "5 Odobreno"]
    for i, l in enumerate(labs):
        a = appear(tb, 0.4 + i * 0.08)
        col = ACC if i == 2 else (TXT if i < 2 else DIM)
        d.text((SAFE_L + 90, 440 + i * 70), l, font=F(FXB if i == 2 else FIN, 44), fill=lerp(BG, col, a))

def b_nomiracle(d, L, k, tb, T):
    ctext(d, GCX, 300, "čudo preko noći", F(FXB, 92), lerp(BG, MUTED, appear(tb, 0)))
    s = ease((tb - 0.3) / 0.4)
    w = tw(d, "čudo preko noći", F(FXB, 92))
    if s > 0:
        d.line((GCX - w / 2 - 20, 370, GCX - w / 2 - 20 + (w + 40) * s, 370), fill=ACC, width=12)
        if int((tb - 0.3) * FPS) == 0: SFX.append((None, "pop"))

def b_journey(d, L, k, tb, T):
    a = ease(tb / 0.5)
    tube(d, SAFE_L + 130, 330, 0.85 * a, 1.0, ACC)
    ctext(d, SAFE_L + 130, 500, "1973", F(FXB, 56), lerp(BG, TXT, a))
    ctext(d, SAFE_L + 130, 565, "epruveta", F(FIN, 38), lerp(BG, MUTED, a))
    p = ease((tb - 0.5) / 1.4)
    x0, x1 = SAFE_L + 240, W - SAFE_R - 270
    for j in range(9):
        x = x0 + (x1 - x0) * j / 8
        if j / 8 <= p: d.ellipse((x - 9, 321, x + 9, 339), fill=ACC)
        else: d.ellipse((x - 6, 324, x + 6, 336), fill=DIM)
    b2 = back((tb - 1.7) / 0.5)
    if b2 > 0:
        face(d, W - SAFE_R - 130, 330, 0.42 * min(1.05, b2), ACC, 12)
        ctext(d, W - SAFE_R - 130, 500, "2016", F(FXB, 56), ACC)
        ctext(d, W - SAFE_R - 130, 565, "lice", F(FIN, 38), MUTED)
    ctext(d, GCX, 700, "tako nauka ide", F(FXB, 66), lerp(BG, TXT, appear(tb, 2.0)))

def b_cta(d, L, k, tb, T):
    bb = back(tb / 0.45)
    cx, y = GCX, 160
    h = 300 * min(1.05, bb)
    d.polygon([(cx - 105, y), (cx + 105, y), (cx + 105, y + h), (cx, y + h * 0.74), (cx - 105, y + h)], fill=ACC)
    ctext(d, GCX, 540, "SAČUVAJ", F(FXB, 110), lerp(BG, TXT, appear(tb, 0.2)))
    ctext(d, GCX, 680, "+ prati za sljedeći peptid", F(FXB, 50), lerp(BG, ACC, appear(tb, 0.6)))

BEATS = {k[2:]: v for k, v in globals().items() if k.startswith("b_")}

# ------------------------------------------------------------------ brand
def logo_mark(d, x, y, s, col):
    r = 30 * s
    d.ellipse((x, y, x + 2 * r, y + 2 * r), outline=col, width=max(2, int(5 * s)))
    for i in range(3):
        cx = x + r - 14 * s + i * 14 * s
        d.ellipse((cx - 4.5 * s, y + r - 4.5 * s, cx + 4.5 * s, y + r + 4.5 * s), fill=col)

def draw_logo(img, alpha):
    ov = Image.new("RGBA", (440, 90), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    logo_mark(od, 0, 10, 1.0, ACC + (255,))
    od.text((78, 20), "PEPTID CENTAR", font=F(FXB, 34), fill=TXT + (255,))
    ov.putalpha(ov.split()[3].point(lambda v: int(v * alpha)))
    img.paste(ov, (SAFE_L, 232), ov)

def end_card(d, p):
    k = ease(p * 3)
    logo_mark(d, GCX - 75, 600, 2.5, lerp(BG, ACC, k))
    ctext(d, GCX, 800, "PEPTID CENTAR", F(FXB, 84), lerp(BG, TXT, k))
    ctext(d, GCX, 915, "Peptidi bez hajpa", F(FXB, 56), lerp(BG, ACC, k))
    ctext(d, GCX, 1180, "Edukacija · nije medicinski savjet", F(FIN, 42), lerp(BG, MUTED, k))
    ctext(d, GCX, 1240, "Izvori u zakačenom komentaru", F(FIN, 36), lerp(BG, DIM, k))

# ------------------------------------------------------------------ subtitles
def build_subs(timing):
    subs = []
    for s, seg in zip(SCRIPT, timing):
        disp = s["sub"].split()
        sw = seg["words"]
        nd, ns = len(disp), len(sw)
        starts = [sw[min(ns - 1, round(i * (ns - 1) / max(1, nd - 1)))]["s"] for i in range(nd)]
        # chunk: <=3 words, <=18 chars, break after punctuation
        chunks, cur = [], []
        for i, w in enumerate(disp):
            if cur and (len(" ".join([disp[j] for j in cur] + [w])) > 18 or len(cur) >= 3):
                chunks.append(cur); cur = []
            cur.append(i)
            if w[-1] in ".,?:!" and len(" ".join(disp[j] for j in cur)) >= 2:
                chunks.append(cur); cur = []
        if cur: chunks.append(cur)
        for ci, c in enumerate(chunks):
            st = starts[c[0]]
            en = starts[chunks[ci + 1][0]] if ci + 1 < len(chunks) else seg["end"] + 0.1
            subs.append({"start": max(seg["start"], st - 0.05), "end": en - 0.02, "words": [disp[j] for j in c], "acc": s["acc"]})
    return subs

def draw_sub(d, sb, t):
    f = F(FXB, 84)
    words = sb["words"]
    line = " ".join(words)
    k = back((t - sb["start"]) / 0.16, 1.3)
    cx = GCX
    w = tw(d, line, f)
    y = (SUB_Y0 + SUB_Y1) / 2 - 50
    pad = 36
    sc = 0.86 + 0.14 * min(1.0, k)
    bw = (w + 2 * pad) * sc
    d.rounded_rectangle((cx - bw / 2, y - 22, cx + bw / 2, y + 112), radius=26, fill=(0x16, 0x18, 0x1B))
    x = cx - w / 2
    a = min(1.0, max(0.0, k))
    for wd in words:
        col = ACC if wd in sb["acc"] else TXT
        d.text((x, y + (1 - a) * 14), wd, font=f, fill=lerp((0x16, 0x18, 0x1B), col, a))
        x += tw(d, wd + " ", f)

# ------------------------------------------------------------------ main
def main():
    timing = json.load(open(os.path.join(B, "timing.json")))
    speech_end = timing[-1]["end"] + 0.35
    total = speech_end + END_CARD
    subs = build_subs(timing)
    beats = []
    for i, (s, seg) in enumerate(zip(SCRIPT, timing)):
        nxt = timing[i + 1]["start"] if i + 1 < len(timing) else speech_end
        L = nxt - seg["start"]
        for j, (name, frac) in enumerate(s["beats"]):
            bs = 0.0 if (i == 0 and j == 0) else seg["start"] + frac * (seg["end"] - seg["start"]) - 0.12
            beats.append([bs, name])
    for j in range(len(beats)):
        beats[j].append(beats[j + 1][0] if j + 1 < len(beats) else speech_end)
    for bs, name, be in beats[1:]:
        SFX.append((bs, "whoosh"))
    SFX.append((speech_end, "whoosh"))
    nframes = int(round(total * FPS))
    out = os.path.join(B, "video_only.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15",
                           "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for fi in range(nframes):
        t = fi / FPS
        img = Image.new("RGB", (W, H), BG)
        d = ImageDraw.Draw(img)
        if t < speech_end:
            for bs, name, be in beats:
                if bs <= t < be:
                    tb, T = t - bs, be - bs
                    L = Image.new("RGB", (W, LAYER_H), BG)
                    n0 = len(SFX)
                    BEATS[name](ImageDraw.Draw(L), L, ease(tb / 0.6), tb, T)
                    for q in range(n0, len(SFX)):
                        if SFX[q][0] is None: SFX[q] = (t, SFX[q][1])
                    # camera: pop-in then slow push
                    intro = 1.0 if (bs == 0.0) else ease(tb / 0.22)
                    sc = (0.93 + 0.07 * intro) * (1.0 + 0.025 * min(1.0, tb / max(1.0, T)))
                    if abs(sc - 1.0) > 1e-3:
                        Ls = L.resize((int(W * sc), int(LAYER_H * sc)), Image.BILINEAR)
                        cx0 = (Ls.width - W) // 2; cy0 = (Ls.height - LAYER_H) // 2
                        if sc >= 1:
                            L = Ls.crop((cx0, cy0, cx0 + W, cy0 + LAYER_H))
                        else:
                            base = Image.new("RGB", (W, LAYER_H), BG); base.paste(Ls, (-cx0, -cy0)); L = base
                    if intro < 1.0:
                        L = Image.blend(Image.new("RGB", L.size, BG), L, intro)
                    img.paste(L, (0, LAYER_Y))
                    break
            for sb in subs:
                if sb["start"] <= t < sb["end"]:
                    draw_sub(d, sb, t); break
            ls = max(3.0, beats[1][0])
            if t >= ls: draw_logo(img, 0.7 * ease((t - ls) / 0.4))
        else:
            end_card(d, (t - speech_end) / END_CARD)
        ff.stdin.write(img.tobytes())
    ff.stdin.close(); ff.wait()
    def ts(x):
        h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
        ms = int(round((s - int(s)) * 1000));
        if ms == 1000: ms = 999
        return f"{h:02d}:{m:02d}:{int(s):02d},{ms:03d}"
    with open(os.path.join(B, "titlovi.srt"), "w", encoding="utf-8") as f:
        for i, sb in enumerate(subs, 1):
            f.write(f"{i}\n{ts(sb['start'])} --> {ts(sb['end'])}\n{' '.join(sb['words'])}\n\n")
    json.dump({"total": total, "speech_end": speech_end, "sfx": SFX, "beats": beats}, open(os.path.join(B, "render_meta.json"), "w"), indent=1)
    print("frames", nframes, "beats", len(beats), "subs", len(subs), "sfx", len(SFX))

if __name__ == "__main__":
    main()

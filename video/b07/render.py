#!/usr/bin/env python3
"""Peptid Centar B07 (BPC-157, tetiva) · predložak B04/B06: real footage + fast cuts + kinetic overlays + karaoke captions.
Reads build/timing.json, stock/*.mp4; writes build/video_only.mp4, build/titlovi.srt, build/render_meta.json."""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from script import SCRIPT
B = os.path.join(HERE, "build"); ST = os.path.join(HERE, "stock")
W, H, FPS = 1080, 1920, 30
FXB = os.path.join(HERE, "..", "fonts", "Manrope-ExtraBold.ttf")
FIN = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
LOGO = os.path.join(HERE, "..", "brand", "logo_avatar_1080.png")
BG = (0x0B, 0x1F, 0x3A); TXT = (255, 255, 255); ACC = (0x19, 0xE0, 0xD8); INK = (0x04, 0x0C, 0x18)
YEL = (0xFF, 0xD2, 0x3F); RED = (0xFF, 0x5A, 0x5A); SOFT = (0xC9, 0xD3, 0xDE)
SAFE_L, SAFE_R = 70, 140
GCX = (SAFE_L + W - SAFE_R) // 2
END_CARD = 3.0
SFX = []

_fc = {}
def F(p, s):
    s = max(4, int(s))
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def back(t, s=2.2):
    t = max(0.0, min(1.0, t)); t -= 1; return 1 + t * t * ((s + 1) * t + s)
def ap(tb, at, d=0.3): return ease((tb - at) / d)
def once(tb, at): return abs(tb - at) < 0.5 / FPS
def sfx(k): SFX.append((None, k))

def st(d, xy, s, f, fill, sw=9, anchor="ma"):
    d.text(xy, s, font=f, fill=fill, stroke_width=sw, stroke_fill=INK, anchor=anchor)

def shade(img, box, alpha=150, radius=40, color=INK):
    x0, y0, x1, y1 = [int(v) for v in box]
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if x1 <= x0 or y1 <= y0: return
    reg = img.crop((x0, y0, x1, y1)).convert("RGBA")
    ov = Image.new("RGBA", reg.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).rounded_rectangle((0, 0, reg.width - 1, reg.height - 1), radius=radius, fill=color + (alpha,))
    img.paste(Image.alpha_composite(reg, ov).convert("RGB"), (x0, y0))

def tag(img, d, cx, y, text, size, k, fg=INK, bg=ACC, rot=0):
    """Solid sticker label, pops in."""
    if k <= 0: return
    f = F(FXB, size * min(1.08, k))
    w = d.textlength(text, font=f) + size * 0.9; h = f.size * 1.5
    d.rounded_rectangle((cx - w / 2, y, cx + w / 2, y + h), radius=h * 0.28, fill=bg)
    d.text((cx, y + h * 0.5), text, font=f, fill=fg, anchor="mm")

# ------------------------------------------------------------------ B07 overlays  fn(img, d, tb, T)   (spliced into render.py)
GRN = (0x3D, 0xE0, 0x7A); GREYC = (0x55, 0x66, 0x7A); BROWN = (0x9A, 0x7B, 0x55)

def heart(d, x, y, s, col):
    d.ellipse((x - s, y - s, x, y), fill=col); d.ellipse((x, y - s, x + s, y), fill=col)
    d.polygon([(x - s * 0.96, y - s * 0.3), (x + s * 0.96, y - s * 0.3), (x, y + s * 0.95)], fill=col)

def xmark(d, cx, cy, s, col=RED, w=16):
    d.line((cx - s, cy - s, cx + s, cy + s), fill=col, width=w); d.line((cx - s, cy + s, cx + s, cy - s), fill=col, width=w)

def check(d, cx, cy, s, col):
    d.ellipse((cx - 110 * s, cy - 110 * s, cx + 110 * s, cy + 110 * s), fill=col, outline=INK, width=8)
    d.line((cx - 52 * s, cy + 2 * s, cx - 12 * s, cy + 44 * s, cx + 58 * s, cy - 40 * s), fill=INK, width=int(26 * s), joint="curve")

def o_hook1(img, d, tb, T):
    k = back(tb / 0.28, 3.0) if tb > 0.01 else 1.0
    if once(tb, 0.0): sfx("boom")
    st(d, (GCX, 270), "NAJGORE", F(FXB, 150 * min(1.08, k)), TXT, sw=13)
    a = back((tb - 0.35) / 0.28, 3)
    if a > 0:
        if once(tb, 0.35): sfx("pop")
        tag(img, d, GCX, 450, "NIJE BOL U KOLJENU", 70, a, TXT, RED)

def o_quote(img, d, tb, T):
    k = back(tb / 0.3, 2.6)
    if once(tb, 0.0): sfx("whoosh")
    if tb > T * 0.35 and once(tb, round(T * 0.35 * FPS) / FPS): sfx("pop")
    # speech bubble (child asks)
    if k <= 0: return
    bx0, by0, bx1, by1 = SAFE_L + 30, 240, W - SAFE_R - 30, 600
    sc = min(1.04, k); cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
    box = (cx - (cx - bx0) * sc, cy - (cy - by0) * sc, cx + (bx1 - cx) * sc, cy + (by1 - cy) * sc)
    d.rounded_rectangle(box, radius=60, fill=TXT, outline=INK, width=8)
    d.polygon([(cx + 60, box[3] - 4), (cx + 160, box[3] - 4), (cx + 210, box[3] + 90)], fill=TXT)
    d.text((cx, box[1] + 60), "„Tata, zašto više", font=F(FXB, 70 * sc), fill=INK, anchor="ma")
    d.text((cx, box[1] + 160), "ne igraš s nama?“", font=F(FXB, 70 * sc), fill=INK, anchor="ma")
    a = back((tb - T * 0.55) / 0.3, 3)
    if a > 0: tag(img, d, cx, box[1] + 270, "…a ti ne znaš šta da kažeš", 40, a, TXT, INK)

def o_past(img, d, tb, T):
    k = back(tb / 0.28, 3)
    tag(img, d, GCX, 260, "NEKAD", 64, k, INK, ACC)
    a = back((tb - 0.45) / 0.28, 3)
    if a > 0:
        if once(tb, 0.45): sfx("pop")
        st(d, (GCX, 380), "MALI FUDBAL", F(FXB, 112 * min(1.05, a)), TXT, sw=12)
        st(d, (GCX, 510), "SVAKE SRIJEDE", F(FXB, 80 * min(1.05, a)), YEL, sw=10)

def o_snap(img, d, tb, T):
    k = back(tb / 0.22, 3.4)
    shake = (1 - min(1, tb / 0.45)) * 18
    if once(tb, 0.0): sfx("boom")
    shade(img, (0, 0, W, H), int(90 * (1 - min(1, tb / 0.6))), 0, RED)
    st(d, (GCX + shake * math.sin(tb * 95), 300 + shake * math.cos(tb * 80)), "TETIVA", F(FXB, 190 * min(1.1, k)), RED, sw=14)
    a = back((tb - 0.35) / 0.28, 3)
    if a > 0: tag(img, d, GCX, 540, "TE IZDA", 76, a, TXT, INK)

def o_tried(img, d, tb, T):
    items = ["LED", "TABLETE", "TRAKE", "MIROVANJE"]
    shade(img, (SAFE_L + 40, 230, W - SAFE_R - 40, 230 + 4 * 135 + 50), 175)
    for i, s in enumerate(items):
        t0 = i * T / 4.6
        a = back((tb - t0) / 0.25, 3)
        if a <= 0: continue
        y = 270 + i * 135
        d.text((SAFE_L + 120, y), s, font=F(FXB, 84 * min(1.05, a)), fill=TXT)
        x2 = ease((tb - t0 - 0.3) / 0.2)
        if x2 > 0:
            if once(tb, round((t0 + 0.3) * FPS) / FPS): sfx("tick")
            xmark(d, W - SAFE_R - 140, y + 46, 38 * x2)

def o_back(img, d, tb, T):
    p = ease(tb / max(0.6, T * 0.5))
    tag(img, d, GCX, 250, "MJESECI", 60, back(tb / 0.25, 3), INK, YEL)
    a = back((tb - 0.45) / 0.25, 3)
    if a > 0:
        if once(tb, 0.45): sfx("pop")
        tag(img, d, GCX, 370, "PROLAZE", 60, a, INK, YEL)
    b = back((tb - T * 0.55) / 0.28, 3)
    if b > 0:
        if once(tb, round(T * 0.55 * FPS) / FPS): sfx("boom")
        st(d, (GCX, 520), "BOL SE VRATI", F(FXB, 112 * min(1.06, b)), RED, sw=13)

def o_resign(img, d, tb, T):
    k = ease(tb / 0.5)
    shade(img, (0, 0, W, H), int(90 * k), 0)
    st(d, (GCX, 330), "I POLAKO SE", F(FXB, 80), (int(255 * k),) * 3, sw=10)
    st(d, (GCX, 440), "POMIRIŠ…", F(FXB, 130), SOFT, sw=12)

def o_bench(img, d, tb, T):
    k = back(tb / 0.3, 3)
    tag(img, d, GCX, 260, "TI SI NA KLUPI", 66, k, TXT, INK)
    a = back((tb - 0.5) / 0.3, 3)
    if a > 0: st(d, (GCX, 400), "a oni igraju", F(FXB, 76 * min(1.05, a)), YEL, sw=10)

def o_why(img, d, tb, T):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("boom")
    st(d, (GCX, 280), "NIKO TI NIJE", F(FXB, 88 * min(1.05, k)), TXT, sw=11)
    st(d, (GCX, 400), "REKAO ZAŠTO", F(FXB, 112 * min(1.05, k)), YEL, sw=12)

def vessel_panel(d, x0, y0, w, h, n, label, col, tb, k):
    d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=36, fill=(0x12, 0x22, 0x38), outline=col, width=6)
    import random
    rnd = random.Random(n)
    for i in range(n):
        yy = y0 + 40 + (h - 80) * (i + 0.5) / n
        pts = []
        for s in range(9):
            xx = x0 + 30 + (w - 60) * s / 8
            pts.append((xx, yy + 14 * math.sin(s * 1.3 + i + tb * 2)))
        L = max(2, int(len(pts) * min(1, k)))
        d.line(pts[:L], fill=RED, width=10, joint="curve")
    d.text((x0 + w / 2, y0 + h + 22), label, font=F(FXB, 58), fill=TXT, anchor="ma", stroke_width=6, stroke_fill=INK)

def o_vessels(img, d, tb, T):
    shade(img, (0, 0, W, H), 160, 0)
    st(d, (GCX, 230), "KRVNE ŽILE", F(FXB, 84), TXT, sw=10)
    pw = 360; gap = 60; x0 = GCX - pw - gap / 2
    vessel_panel(d, x0, 360, pw, 520, 9, "MIŠIĆ", GRN, tb, ease(tb / 0.6))
    a = ease((tb - 0.5) / 0.6)
    if a > 0:
        if once(tb, 0.5): sfx("pop")
        vessel_panel(d, x0 + pw + gap, 360, pw, 520, 2, "TETIVA", RED, tb, a)

def truck(d, x, y, s, col=YEL):
    d.rounded_rectangle((x - 60 * s, y - 34 * s, x + 30 * s, y + 20 * s), radius=8, fill=col, outline=INK, width=5)
    d.rounded_rectangle((x + 30 * s, y - 18 * s, x + 66 * s, y + 20 * s), radius=8, fill=TXT, outline=INK, width=5)
    for wx in (-38, 44):
        d.ellipse((x + (wx - 14) * s, y + 10 * s, x + (wx + 14) * s, y + 38 * s), fill=INK)

def road_scene(d, tb, paved, speed):
    # winding road from bottom-left (city) to top (village = tendon)
    pts = [(GCX - 300, 1110), (GCX - 120, 990), (GCX + 160, 910), (GCX + 40, 770), (GCX - 180, 670), (GCX + 80, 540)]
    col = (0x2B, 0x2F, 0x36) if paved else BROWN
    d.line(pts, fill=col, width=70 if paved else 46, joint="curve")
    if paved:
        for i in range(len(pts) - 1):
            (x0, y0), (x1, y1) = pts[i], pts[i + 1]
            for q in range(4):
                f0, f1 = q / 4 + 0.04, q / 4 + 0.15
                d.line((x0 + (x1 - x0) * f0, y0 + (y1 - y0) * f0, x0 + (x1 - x0) * f1, y0 + (y1 - y0) * f1), fill=TXT, width=6)
    else:
        for i in range(30):
            q = (i * 37) % 100 / 100; j = int(q * (len(pts) - 1)); f = q * (len(pts) - 1) - j
            x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f + ((i * 13) % 30 - 15); y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f + ((i * 7) % 20 - 10)
            d.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(0x6A, 0x55, 0x3A))
    # village = tendon
    vx, vy = GCX + 80, 490
    for hx in (-70, 0, 70):
        d.rectangle((vx + hx - 26, vy - 10, vx + hx + 26, vy + 34), fill=TXT, outline=INK, width=4)
        d.polygon([(vx + hx - 34, vy - 8), (vx + hx + 34, vy - 8), (vx + hx, vy - 44)], fill=RED, outline=INK)
    tag(None, d, vx + 190, vy - 30, "TETIVA", 46, 1, INK, ACC)
    # truck travelling along the road
    q = (tb * speed) % 1
    seg = q * (len(pts) - 1); j = min(len(pts) - 2, int(seg)); f = seg - j
    x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f; y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f
    bump = 0 if paved else 6 * math.sin(tb * 40)
    truck(d, x, y - 30 + bump, 1.0, GRN if paved else YEL)

def o_road(img, d, tb, T):
    shade(img, (0, 0, W, H), 175, 0)
    k = back(tb / 0.3, 3)
    tag(img, d, GCX, 210, "SELO NA KRAJU MAKADAMA", 54, k, INK, YEL)
    road_scene(d, tb, False, 0.12)
    a = back((tb - T * 0.55) / 0.3, 3)
    if a > 0:
        if once(tb, round(T * 0.55 * FPS) / FPS): sfx("pop")
        tag(img, d, GCX, 1170, "materijal za popravku jedva stigne", 40, a, TXT, INK)

def o_months(img, d, tb, T):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("boom")
    st(d, (GCX, 260), "ZARASTA", F(FXB, 96 * min(1.05, k)), TXT, sw=11)
    st(d, (GCX, 380), "MJESECIMA", F(FXB, 140 * min(1.05, k)), RED, sw=13)
    n = int(min(12, 1 + tb * 9))
    for i in range(12):
        x = GCX - 5.5 * 70 + i * 70; y = 590
        d.rounded_rectangle((x - 26, y - 26, x + 26, y + 26), radius=8, fill=RED if i < n else GREYC, outline=INK, width=4)

def o_icepill(img, d, tb, T):
    shade(img, (SAFE_L + 30, 230, W - SAFE_R - 30, 640), 175)
    st(d, (GCX, 260), "LED I TABLETE", F(FXB, 76), TXT, sw=9)
    a = back((tb - 0.25) / 0.25, 3)
    if a > 0:
        d.text((SAFE_L + 110, 390), "smire bol", font=F(FXB, 64 * min(1.05, a)), fill=TXT)
        check(d, W - SAFE_R - 140, 425, 0.42 * min(1.05, a), GRN)
    b = back((tb - T * 0.5) / 0.25, 3)
    if b > 0:
        if once(tb, round(T * 0.5 * FPS) / FPS): sfx("boom")
        d.text((SAFE_L + 110, 510), "dovedu krv", font=F(FXB, 64 * min(1.05, b)), fill=TXT)
        xmark(d, W - SAFE_R - 140, 548, 40 * min(1, b))

def o_reveal(img, d, tb, T):
    k = back(tb / 0.3, 3.2)
    if once(tb, 0.0): sfx("ding")
    shade(img, (SAFE_L + 30, 250, W - SAFE_R - 30, 640), int(185 * min(1, k)))
    d.text((GCX, 270), "A ONDA OTKRIJEŠ", font=F(FXB, 50), fill=ACC, anchor="ma")
    d.text((GCX, 360), "BPC-157", font=F(FXB, 190 * min(1.06, k)), fill=TXT, anchor="ma")
    for i in range(10):
        ang = i * 0.628 + tb * 0.6; r = 330 + 30 * math.sin(tb * 3 + i)
        x, y = GCX + r * math.cos(ang), 450 + 0.55 * r * math.sin(ang)
        d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=YEL)

def o_zagreb(img, d, tb, T):
    k = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("pop")
    tag(img, d, GCX, 250, "RAZVIJEN U ZAGREBU", 66, k, INK, YEL)
    a = back((tb - 0.5) / 0.28, 3)
    if a > 0:
        st(d, (GCX, 400), "iz ljudskog", F(FXB, 70 * min(1.05, a)), TXT, sw=9)
        st(d, (GCX, 490), "želučanog soka", F(FXB, 86 * min(1.05, a)), ACC, sw=10)

def o_three(img, d, tb, T):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("boom")
    shade(img, (0, 0, W, H), 120, 0)
    st(d, (GCX, 250), "3", F(FXB, 320 * min(1.08, k)), YEL, sw=14)
    st(d, (GCX, 600), "STVARI", F(FXB, 110), TXT, sw=12)

def mech_head(img, d, tb, n, title):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("pop")
    shade(img, (0, 0, W, H), 170, 0)
    r = 62 * min(1.08, k)
    d.ellipse((SAFE_L + 40, 230, SAFE_L + 40 + 2 * r, 230 + 2 * r), fill=YEL)
    d.text((SAFE_L + 40 + r, 230 + r), str(n), font=F(FXB, 90 * min(1.05, k)), fill=INK, anchor="mm")
    d.text((SAFE_L + 190, 252), title, font=F(FXB, 62), fill=TXT)

def o_m1(img, d, tb, T):
    mech_head(img, d, tb, 1, "NOVE KRVNE ŽILE")
    paved = tb > T * 0.4
    if paved and once(tb, round(T * 0.4 * FPS) / FPS): sfx("ding")
    road_scene(d, tb, paved, 0.55 if paved else 0.12)
    if paved: tag(img, d, GCX, 1170, "put do tetive: ASFALTIRAN", 46, back((tb - T * 0.4) / 0.3, 3), INK, GRN)

def o_m2(img, d, tb, T):
    mech_head(img, d, tb, 2, "ĆELIJE BRŽE STIŽU")
    # injury target + migrating cells
    tx, ty = GCX + 230, 680
    d.ellipse((tx - 90, ty - 90, tx + 90, ty + 90), outline=RED, width=10)
    d.line((tx - 40, ty - 40, tx + 40, ty + 40), fill=RED, width=10)
    d.text((tx, ty + 110), "povreda", font=F(FXB, 44), fill=TXT, anchor="ma")
    for i in range(7):
        sx, sy = SAFE_L + 70, 450 + i * 65
        p = (tb * 0.55 + i * 0.143) % 1.0
        x = sx + (tx - 70 - sx) * p; y = sy + (ty - sy) * p
        for tr in range(1, 4):
            q = max(0, p - tr * 0.05); xx = sx + (tx - 70 - sx) * q; yy = sy + (ty - sy) * q
            d.ellipse((xx - 26 + tr * 5, yy - 26 + tr * 5, xx + 26 - tr * 5, yy + 26 - tr * 5), fill=(0x10, 0x70, 0x70))
        d.ellipse((x - 26, y - 26, x + 26, y + 26), fill=ACC, outline=INK, width=4)
        d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=INK)

def o_m3(img, d, tb, T):
    mech_head(img, d, tb, 3, "BOLJE ČUJU SIGNAL")
    cx, cy = GCX - 120, 690
    d.ellipse((cx - 110, cy - 110, cx + 110, cy + 110), fill=ACC, outline=INK, width=6)
    d.text((cx, cy), "ĆELIJA", font=F(FXB, 42), fill=INK, anchor="mm")
    nrec = 2 + int(min(1, tb / max(0.5, T * 0.5)) * 8)
    for i in range(nrec):
        ang = -math.pi / 2 + i * 2 * math.pi / 10
        x0, y0 = cx + 110 * math.cos(ang), cy + 110 * math.sin(ang)
        x1, y1 = cx + 150 * math.cos(ang), cy + 150 * math.sin(ang)
        d.line((x0, y0, x1, y1), fill=YEL, width=10); d.ellipse((x1 - 14, y1 - 14, x1 + 14, y1 + 14), fill=YEL)
    for q in range(3):
        rr = 60 + ((tb * 160 + q * 70) % 210)
        d.arc((cx + 260 - rr, cy - rr, cx + 260 + rr, cy + rr), 150, 210, fill=TXT, width=8)
    tag(img, d, cx + 250, cy + 190, "hormon rasta", 44, back((tb - 0.3) / 0.3, 3), INK, YEL)

def o_proof(img, d, tb, T):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("boom")
    shade(img, (SAFE_L + 20, 220, W - SAFE_R - 20, 930), 170)
    st(d, (GCX, 240), "11 OD 12", F(FXB, 190 * min(1.06, k)), YEL, sw=13)
    for i in range(12):
        a = back((tb - 0.3 - i * 0.08) / 0.2, 3)
        if a <= 0: continue
        if once(tb, round((0.3 + i * 0.08) * FPS) / FPS): sfx("tick")
        c, r_ = i % 6, i // 6
        x = GCX - 2.5 * 120 + c * 120; y = 530 + r_ * 150; col = GRN if i < 11 else GREYC
        rr = 34 * min(1.1, a)
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=col, outline=INK, width=5)
        d.rounded_rectangle((x - rr, y + rr + 6, x + rr, y + rr + max(8, 60 * min(1, a))), radius=6, fill=col, outline=INK, width=5)
    d.text((GCX, 830), "bol u koljenu značajno manja", font=F(FXB, 50), fill=TXT, anchor="ma")
    tag(img, d, GCX, 945, "klinička serija · 2021", 36, back((tb - 1.0) / 0.25), TXT, INK)

def o_notsteroid(img, d, tb, T):
    shade(img, (SAFE_L + 30, 230, W - SAFE_R - 30, 760), 175)
    rows = [("STEROID", False, 0.0), ("TABLETA ZA BOL", False, T * 0.22), ("POPRAVKA TKIVA", True, T * 0.5)]
    for i, (s, ok, t0) in enumerate(rows):
        a = back((tb - t0) / 0.25, 3)
        if a <= 0: continue
        if once(tb, round(t0 * FPS) / FPS): sfx("ding" if ok else "pop")
        y = 270 + i * 160
        d.text((SAFE_L + 110, y), s, font=F(FXB, 70 * min(1.05, a)), fill=GRN if ok else SOFT)
        if ok: check(d, W - SAFE_R - 140, y + 40, 0.42 * min(1.05, a), GRN)
        else:
            xmark(d, W - SAFE_R - 140, y + 40, 36 * min(1, a))
            tw = d.textlength(s, font=F(FXB, 70)); d.line((SAFE_L + 100, y + 44, SAFE_L + 120 + tw, y + 44), fill=RED, width=8)

def o_future(img, d, tb, T):
    k = back(tb / 0.3, 3)
    if once(tb, 0.0): sfx("ding")
    st(d, (GCX, 260), "ZAMISLI", F(FXB, 140 * min(1.06, k)), YEL, sw=13)
    a = back((tb - 0.4) / 0.28, 3)
    if a > 0: tag(img, d, GCX, 440, "SUBOTA UJUTRO · TI NA GOLU", 54, a, INK, ACC)

def o_hug(img, d, tb, T):
    k = back(tb / 0.3, 3)
    if once(tb, 0.0): sfx("pop")
    heart(d, GCX, 300, 90 * min(1.08, k), RED)
    for i in range(7):
        ph = (tb * 0.45 + i * 0.15) % 1
        heart(d, SAFE_L + 60 + (i * 137) % 780, 1150 - ph * 600, 18 + (i % 3) * 8, RED)

def o_nofear(img, d, tb, T):
    k = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("boom")
    st(d, (GCX, 280), "BEZ STRAHA", F(FXB, 130 * min(1.06, k)), TXT, sw=13)
    a = back((tb - 0.4) / 0.28, 3)
    if a > 0: st(d, (GCX, 430), "od sljedećeg koraka", F(FXB, 70 * min(1.05, a)), GRN, sw=10)

def o_save(img, d, tb, T):
    k = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("pop")
    cx, y = GCX, 300; h = 230 * min(1.08, k)
    d.polygon([(cx - 85, y), (cx + 85, y), (cx + 85, y + h), (cx, y + h * 0.74), (cx - 85, y + h)], fill=YEL, outline=INK, width=8)
    st(d, (GCX, 570), "POŠALJI", F(FXB, 130 * min(1.05, k)), TXT, sw=12)
    tag(img, d, GCX, 745, "nekome kome tetiva ne da mira", 46, back((tb - T * 0.3) / 0.28), INK, ACC)

_logo = {}
def logo_img(size):
    if size not in _logo:
        im = Image.open(LOGO).convert("RGB").resize((size, size), Image.LANCZOS)
        m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 4, size * 4), fill=255)
        im.putalpha(m.resize((size, size), Image.LANCZOS)); _logo[size] = im
    return _logo[size]

def o_follow(img, d, tb, T):
    k = back(tb / 0.3, 3)
    if once(tb, 0.0): sfx("pop")
    sz = max(8, int(260 * min(1.06, k))); lg = logo_img(sz)
    img.paste(lg, (GCX - sz // 2, 300 + (260 - sz) // 2), lg)
    st(d, (GCX, 600), "PRATI", F(FXB, 120), TXT, sw=12)
    tag(img, d, GCX, 760, "@peptidcentar", 66, back((tb - 0.25) / 0.28), INK, ACC)

OV = {k[2:]: v for k, v in dict(globals()).items() if k.startswith("o_")}

# ------------------------------------------------------------------ captions (karaoke)
def build_subs(timing):
    subs = []
    for s, seg in zip(SCRIPT, timing):
        disp = s["sub"].split(); sw = seg["words"]; nd, ns = len(disp), len(sw)
        idx = [min(ns - 1, round(i * (ns - 1) / max(1, nd - 1))) for i in range(nd)]
        starts = [sw[j]["s"] for j in idx]
        chunks, cur = [], []
        for i, w in enumerate(disp):
            if cur and (len(" ".join(disp[j] for j in cur + [i])) > 15 or len(cur) >= 3): chunks.append(cur); cur = []
            cur.append(i)
            if w[-1] in ".,?:!": chunks.append(cur); cur = []
        if cur: chunks.append(cur)
        for ci, c in enumerate(chunks):
            en = starts[chunks[ci + 1][0]] if ci + 1 < len(chunks) else seg["end"] + 0.1
            ws = [(disp[j], starts[j]) for j in c]
            subs.append({"start": starts[c[0]] - 0.04, "end": en - 0.01, "words": ws, "acc": s["acc"]})
    return subs

def draw_caption(img, d, sb, t):
    k = back((t - sb["start"]) / 0.12, 2.5)
    f = F(FXB, 92 * (0.88 + 0.12 * min(1.05, k)))
    words = [w for w, _ in sb["words"]]
    w = d.textlength(" ".join(words), font=f)
    x = GCX - w / 2; y = 1290
    cur = max(i for i, (_, s0) in enumerate(sb["words"]) if s0 - 0.03 <= t) if any(s0 - 0.03 <= t for _, s0 in sb["words"]) else 0
    for i, wd in enumerate(words):
        ww = d.textlength(wd, font=f)
        if i == cur:
            d.rounded_rectangle((x - 14, y - 2, x + ww + 14, y + f.size * 1.28), radius=18, fill=ACC)
            d.text((x, y), wd, font=f, fill=INK)
        else:
            d.text((x, y), wd, font=f, fill=YEL if wd in sb["acc"] else TXT, stroke_width=9, stroke_fill=INK)
        x += d.textlength(wd + " ", font=f)

HV_WHITE = (0xF6, 0xF6, 0xF3); HV_NAVY = (0x14, 0x23, 0x3C); HV_GREY = (0x8E, 0x99, 0xA4); HV_TEXT = (0x4B, 0x58, 0x69)
HV_LOGO = os.path.join(HERE, "..", "brand", "helvera", "helvera_logo.png")
FREG = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
_hv = {}
def end_card(img, p):
    """Calm HELVERA signature: alpine white, lots of empty space, logo, one quiet line."""
    d = ImageDraw.Draw(img)
    k = ease(p * 2.2)                      # slow fade-in
    mixw = lambda c: tuple(int(HV_WHITE[i] + (c[i] - HV_WHITE[i]) * k) for i in range(3))
    def spaced(y, s, f, col, sp):
        w = sum(d.textlength(ch, font=f) + sp for ch in s) - sp; x = W / 2 - w / 2
        for ch in s:
            d.text((x, y), ch, font=f, fill=col); x += d.textlength(ch, font=f) + sp
    spaced(690, "PEPTID CENTAR", F(FIN, 34), mixw(HV_NAVY), 9)
    lw = int(150 * ease(p * 2.2))
    d.line((W / 2 - lw, 770, W / 2 + lw, 770), fill=mixw(HV_GREY), width=2)
    d.text((W / 2, 808), "edukativni projekat brenda", font=F(FREG, 40), fill=mixw(HV_TEXT), anchor="ma")
    if os.path.exists(HV_LOGO):
        if "lg" not in _hv:
            lg = Image.open(HV_LOGO).convert("RGBA"); w = 640; lg = lg.resize((w, int(lg.height * w / lg.width)), Image.LANCZOS); _hv["lg"] = lg
        lg = _hv["lg"].copy(); a2 = ease((p - 0.18) * 2.4)
        lg.putalpha(lg.split()[3].point(lambda v: int(v * a2)))
        img.paste(lg, (int(W / 2 - lg.width / 2), 930), lg)
    else:
        spaced(940, "HELVERA", F(FXB, 96), mixw(HV_NAVY), 14)
    d.text((W / 2, 1330), "Edukacija · nije medicinski savjet", font=F(FREG, 30), fill=mixw(HV_GREY), anchor="ma")

GRAD = None
def gradient():
    global GRAD
    if GRAD is None:
        g = Image.new("L", (1, H), 0)
        for y in range(H):
            a = 0
            if y < 420: a = int(110 * (1 - y / 420))
            if y > 1050: a = int(170 * min(1, (y - 1050) / 500))
            g.putpixel((0, y), a)
        GRAD = g.resize((W, H))
    return GRAD

def build_base(beats):
    parts = []
    for i, (bs, clip, off, ov, be) in enumerate(beats):
        out = os.path.join(B, f"base_{i}.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-stream_loop", "-1", "-ss", str(off), "-i", os.path.join(ST, clip + ".mp4"),
                        "-t", f"{be - bs + 0.05:.3f}", "-an", "-vf",
                        "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,eq=saturation=1.12:contrast=1.06,setsar=1",
                        "-frames:v", str(int(round((be - bs) * FPS))), "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-pix_fmt", "yuv420p", out], check=True)
        parts.append(out)
    lst = os.path.join(B, "base_list.txt")
    with open(lst, "w") as f:
        for p in parts: f.write(f"file '{p}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", os.path.join(B, "base.mp4")], check=True)

def main():
    timing = json.load(open(os.path.join(B, "timing.json")))
    speech_end = timing[-1]["end"] + 0.25; total = speech_end + END_CARD
    subs = build_subs(timing)
    beats = []
    for i, (s, seg) in enumerate(zip(SCRIPT, timing)):
        for j, (frac, clip, off, ov) in enumerate(s["beats"]):
            bs = 0.0 if (i == 0 and j == 0) else seg["start"] + frac * (seg["end"] - seg["start"]) - 0.08
            beats.append([round(bs * FPS) / FPS, clip, off, ov])
    for j in range(len(beats)): beats[j].append(beats[j + 1][0] if j + 1 < len(beats) else round(speech_end * FPS) / FPS)
    speech_end = beats[-1][4]; total = speech_end + END_CARD
    for b in beats[1:]: SFX.append((b[0], "whoosh"))
    SFX.append((speech_end, "whoosh"))
    build_base(beats)
    rd = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", os.path.join(B, "base.mp4"), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    ff = subprocess.Popen(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", os.path.join(B, "video_only.mp4")], stdin=subprocess.PIPE)
    n = int(round(total * FPS)); last = Image.new("RGB", (W, H), BG); black = Image.new("RGB", (W, H), INK); white = Image.new("RGB", (W, H), (255, 255, 255))
    for fi in range(n):
        t = fi / FPS
        if t < speech_end - 1e-6:
            raw = rd.stdout.read(W * H * 3)
            if len(raw) == W * H * 3: last = Image.frombytes("RGB", (W, H), raw)
            frame = last
            for j, (bs, clip, off, ov, be) in enumerate(beats):
                if bs - 1e-6 <= t < be - 1e-6:
                    tb, T = t - bs, be - bs
                    z = 1.0 + 0.07 * (tb / T) + (0.14 * (1 - ease(tb / 0.18)) if j else 0)   # push-in + punch on cut
                    cw, ch = W / z, H / z
                    frame = frame.transform((W, H), Image.EXTENT, ((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2), Image.BILINEAR)
                    frame = Image.composite(black, frame, gradient())
                    if j and tb < 2.5 / FPS: frame = Image.blend(frame, white, 0.35 * (1 - tb * FPS / 2.5))
                    d = ImageDraw.Draw(frame)
                    n0 = len(SFX)
                    OV[ov](frame, d, tb, T)
                    for q in range(n0, len(SFX)):
                        if SFX[q][0] is None: SFX[q] = (t, SFX[q][1])
                    break
            d = ImageDraw.Draw(frame)
            for sb in subs:
                if sb["start"] <= t < sb["end"]: draw_caption(frame, d, sb, t); break
            # progress bar + small logo
            d.rectangle((0, 0, W, 10), fill=INK); d.rectangle((0, 0, int(W * t / speech_end), 10), fill=ACC)
            if t > 1.2:
                lg = logo_img(72); frame.paste(lg, (SAFE_L, 150), lg)
                d.text((SAFE_L + 86, 166), "Peptid Centar", font=F(FXB, 32), fill=TXT, stroke_width=4, stroke_fill=INK)
        else:
            frame = Image.new("RGB", (W, H), HV_WHITE); end_card(frame, (t - speech_end) / END_CARD)
        ff.stdin.write(frame.tobytes())
    ff.stdin.close(); ff.wait(); rd.kill()
    def ts(x):
        ms = int(round((x % 1) * 1000)) % 1000
        return f"{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{ms:03d}"
    with open(os.path.join(B, "titlovi.srt"), "w", encoding="utf-8") as f:
        for i, sb in enumerate(subs, 1): f.write(f"{i}\n{ts(max(0, sb['start']))} --> {ts(sb['end'])}\n{' '.join(w for w, _ in sb['words'])}\n\n")
    seen, clean = {}, []
    for t, kd in sorted((s for s in SFX if s[0] is not None), key=lambda x: x[0]):
        if kd in seen and t - seen[kd] < (0.06 if kd == "tick" else 0.2): continue
        seen[kd] = t; clean.append((t, kd))
    json.dump({"total": total, "speech_end": speech_end, "sfx": clean}, open(os.path.join(B, "render_meta.json"), "w"), indent=1)
    print("frames", n, "beats", len(beats), "subs", len(subs), "sfx", len(clean))

if __name__ == "__main__":
    main()

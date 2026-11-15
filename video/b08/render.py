#!/usr/bin/env python3
"""Peptid Centar B08 (buka hrane, semaglutid) · predložak B04/B06: real footage + fast cuts + kinetic overlays + karaoke captions.
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

# ------------------------------------------------------------------ B08 overlays  fn(img, d, tb, T)
GRN = (0x3D, 0xE0, 0x7A); GREYC = (0x55, 0x66, 0x7A)

def heart(d, x, y, s, col):
    d.ellipse((x - s, y - s, x, y), fill=col); d.ellipse((x, y - s, x + s, y), fill=col)
    d.polygon([(x - s * 0.96, y - s * 0.3), (x + s * 0.96, y - s * 0.3), (x, y + s * 0.95)], fill=col)

def xmark(d, cx, cy, s, col=RED, w=16):
    d.line((cx - s, cy - s, cx + s, cy + s), fill=col, width=w); d.line((cx - s, cy + s, cx + s, cy - s), fill=col, width=w)

def at(tb, t0): return once(tb, round(t0 * FPS) / FPS)

def o_hook1(img, d, tb, T):
    k = back(tb / 0.28, 3.0) if tb > 0.01 else 1.0
    if once(tb, 0.0): sfx("boom")
    st(d, (GCX, 260), "NISI", F(FXB, 120 * min(1.08, k)), TXT, sw=12)
    st(d, (GCX, 390), "SLABA", F(FXB, 210 * min(1.08, k)), YEL, sw=14)
    a = back((tb - T * 0.45) / 0.28, 3)
    if a > 0:
        if at(tb, T * 0.45): sfx("pop")
        tag(img, d, GCX, 660, "I NEMAŠ MANJAK VOLJE", 58, a, INK, ACC)

def o_anchor(img, d, tb, T):
    k = back(tb / 0.28, 3)
    tag(img, d, GCX, 250, "AKO CIJELI DAN", 62, k, INK, YEL)
    a = back((tb - 0.4) / 0.28, 3)
    if a > 0:
        st(d, (GCX, 380), "MISLIŠ NA", F(FXB, 100 * min(1.05, a)), TXT, sw=12)
        st(d, (GCX, 500), "HRANU", F(FXB, 190 * min(1.05, a)), RED, sw=14)
    b = back((tb - T * 0.7) / 0.28, 3)
    if b > 0:
        if at(tb, T * 0.7): sfx("pop")
        tag(img, d, GCX, 760, "OVO JE ZA TEBE", 60, b, INK, ACC)

def o_night(img, d, tb, T):
    k = back(tb / 0.3, 3)
    if once(tb, 0.0): sfx("tick")
    shade(img, (GCX - 260, 240, GCX + 260, 470), 190)
    col = TXT if int(tb * 2) % 2 == 0 else SOFT
    d.text((GCX, 250), "22:00", font=F(FXB, 170 * min(1.04, k)), fill=col, anchor="ma")
    a = back((tb - 0.6) / 0.28, 3)
    if a > 0: tag(img, d, GCX, 500, "kuća je tiha", 50, a, TXT, INK)

def bubble(img, d, x0, y0, x1, y1, lines, k, size=56, tail="l"):
    if k <= 0: return
    d.rounded_rectangle((x0, y0, x1, y1), radius=46, fill=TXT, outline=INK, width=7)
    tx = x0 + 90 if tail == "l" else x1 - 90
    d.polygon([(tx - 40, y1 - 4), (tx + 40, y1 - 4), (tx - 10 if tail == "l" else tx + 10, y1 + 60)], fill=TXT)
    for i, s in enumerate(lines):
        d.text(((x0 + x1) / 2, y0 + 34 + i * size * 1.25), s, font=F(FXB, size), fill=INK, anchor="ma")

def o_negotiate(img, d, tb, T):
    a = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("pop")
    bubble(img, d, SAFE_L + 20, 240, SAFE_L + 560, 420, ["„Samo jedan", "zalogaj…“"], a)
    b = back((tb - T * 0.45) / 0.28, 3)
    if b > 0:
        if at(tb, T * 0.45): sfx("pop")
        bubble(img, d, W - SAFE_R - 560, 500, W - SAFE_R - 20, 680, ["„Ne, rekla si", "da nećeš.“"], b, tail="r")

def o_tried(img, d, tb, T):
    items = ["KETO", "POST", "KALORIJE"]
    shade(img, (SAFE_L + 40, 230, W - SAFE_R - 40, 230 + 3 * 140 + 50), 175)
    for i, s in enumerate(items):
        t0 = 0.5 + i * (T - 0.5) / 3.6
        a = back((tb - t0) / 0.25, 3)
        if a <= 0: continue
        y = 270 + i * 140
        d.text((SAFE_L + 120, y), s, font=F(FXB, 88 * min(1.05, a)), fill=TXT)
        x2 = ease((tb - t0 - 0.3) / 0.2)
        if x2 > 0:
            if at(tb, t0 + 0.3): sfx("tick")
            xmark(d, W - SAFE_R - 140, y + 48, 38 * x2)

def o_blame(img, d, tb, T):
    k = ease(tb / 0.4)
    shade(img, (0, 0, W, H), int(80 * k), 0)
    tag(img, d, GCX, 250, "GLAS U GLAVI POBIJEDI", 54, back(tb / 0.28, 3), TXT, RED)
    a = back((tb - T * 0.5) / 0.3, 3)
    if a > 0:
        if at(tb, T * 0.5): sfx("boom")
        st(d, (GCX, 400), "I KRIVIŠ", F(FXB, 96 * min(1.05, a)), TXT, sw=11)
        st(d, (GCX, 520), "SEBE", F(FXB, 200 * min(1.05, a)), SOFT, sw=14)

def o_name(img, d, tb, T):
    k = back(tb / 0.25, 3)
    tag(img, d, GCX, 250, "TAJ GLAS IMA IME", 56, k, INK, ACC)
    a = back((tb - T * 0.4) / 0.28, 3.2)
    if a > 0:
        if at(tb, T * 0.4): sfx("boom")
        sh = (1 - min(1, (tb - T * 0.4) / 0.5)) * 12
        st(d, (GCX + sh * math.sin(tb * 90), 390), "BUKA", F(FXB, 200 * min(1.06, a)), YEL, sw=14)
        st(d, (GCX, 600), "HRANE", F(FXB, 200 * min(1.06, a)), YEL, sw=14)

def o_signal(img, d, tb, T):
    shade(img, (0, 0, W, H), 150, 0)
    a = back(tb / 0.25, 3)
    f = F(FXB, 110 * min(1.05, a)); s = "KARAKTER"
    d.text((GCX, 300), s, font=f, fill=SOFT, anchor="ma")
    x2 = ease((tb - 0.35) / 0.25)
    if x2 > 0:
        if at(tb, 0.35): sfx("tick")
        w = d.textlength(s, font=f); d.line((GCX - w / 2 - 20, 372, GCX - w / 2 - 20 + (w + 40) * x2, 372), fill=RED, width=14)
    b = back((tb - T * 0.5) / 0.28, 3.2)
    if b > 0:
        if at(tb, T * 0.5): sfx("ding")
        st(d, (GCX, 520), "SIGNAL", F(FXB, 210 * min(1.06, b)), GRN, sw=14)

def radio(d, cx, cy, s, vol, tb):
    d.rounded_rectangle((cx - 230 * s, cy - 130 * s, cx + 230 * s, cy + 130 * s), radius=36 * s, fill=(0x1B, 0x2C, 0x48), outline=ACC, width=8)
    d.line((cx + 120 * s, cy - 130 * s, cx + 200 * s, cy - 250 * s), fill=ACC, width=8)
    d.ellipse((cx - 190 * s, cy - 90 * s, cx - 10 * s, cy + 90 * s), fill=INK, outline=ACC, width=6)
    r = (40 + 28 * vol * abs(math.sin(tb * 14))) * s
    d.ellipse((cx - 100 * s - r, cy - r, cx - 100 * s + r, cy + r), fill=RED if vol > 0.4 else GRN)
    # volume bars
    for i in range(6):
        on = i < round(vol * 6)
        x = cx + 30 * s + i * 30 * s; h = (20 + i * 14) * s
        d.rectangle((x, cy + 70 * s - h, x + 20 * s, cy + 70 * s), fill=(RED if vol > 0.4 else GRN) if on else GREYC)

def waves(d, cx, cy, tb, vol):
    words = ["hrana", "čokolada", "hrana", "nešto slatko", "hrana", "frižider"]
    n = max(0, round(vol * 6))
    for i in range(n):
        ph = (tb * 0.35 + i / 6) % 1
        ang = -math.pi / 2 + (i - 2.5) * 0.42
        r = 60 + ph * 420
        x, y = min(W - SAFE_R - 130, max(SAFE_L + 130, cx + r * math.cos(ang) * 0.9)), cy + r * math.sin(ang) * 0.75
        f = F(FXB, 34 + 26 * (1 - ph))
        d.text((x, y), words[i], font=f, fill=TXT if ph < 0.6 else SOFT, anchor="mm", stroke_width=5, stroke_fill=INK)

def o_radio(img, d, tb, T):
    shade(img, (0, 0, W, H), 165, 0)
    tag(img, d, GCX, 220, "RADIO U GLAVI", 60, back(tb / 0.25, 3), INK, YEL)
    waves(d, GCX, 760, tb, 1.0)
    radio(d, GCX, 930, 1.5, 1.0, tb)
    if int(tb * 5) != int((tb - 1 / FPS) * 5): sfx("tick")

def o_glp(img, d, tb, T):
    shade(img, (0, 0, W, H), 165, 0)
    p = ease((tb - 0.3) / 0.8); back_up = ease((tb - T * 0.62) / 0.7)
    vol = max(0.0, 1 - p) if back_up <= 0 else back_up
    tag(img, d, GCX, 220, "GLP-1 · hormon sitosti", 54, back(tb / 0.25, 3), INK, GRN)
    waves(d, GCX, 760, tb, vol)
    radio(d, GCX, 930, 1.5, vol, tb)
    if at(tb, 0.3): sfx("ding")
    if back_up > 0:
        if at(tb, T * 0.62): sfx("boom")
        tag(img, d, GCX, 1190, "…ali traje samo par minuta", 46, back((tb - T * 0.62) / 0.3, 3), TXT, RED)
    else:
        a = back((tb - 0.9) / 0.3, 3)
        if a > 0: tag(img, d, GCX, 1190, "stišava radio", 50, a, INK, GRN)

def o_sema(img, d, tb, T):
    k = back(tb / 0.3, 3.2)
    if once(tb, 0.0): sfx("ding")
    shade(img, (SAFE_L + 20, 240, W - SAFE_R - 20, 620), int(185 * min(1, k)))
    d.text((GCX, 262), "PEPTID", font=F(FXB, 50), fill=ACC, anchor="ma")
    d.text((GCX, 340), "SEMAGLUTID", font=F(FXB, 118 * min(1.05, k)), fill=TXT, anchor="ma")
    d.text((GCX, 500), "oponaša GLP-1", font=F(FIN, 44), fill=SOFT, anchor="ma")
    # 7 day bar
    a = ease((tb - T * 0.45) / 1.0)
    if a > 0:
        if at(tb, T * 0.45): sfx("pop")
        days = ["P", "U", "S", "Č", "P", "S", "N"]
        for i in range(7):
            x = GCX - 3 * 110 + i * 110; on = i < a * 7
            d.rounded_rectangle((x - 46, 690, x + 46, 790), radius=18, fill=GRN if on else GREYC, outline=INK, width=5)
            d.text((x, 740), days[i], font=F(FXB, 50), fill=INK, anchor="mm")
        tag(img, d, GCX, 830, "TRAJE CIJELU SEDMICU", 52, back((tb - T * 0.45 - 0.5) / 0.3, 3), INK, YEL)
    tag(img, d, GCX, 960, "−14,9% težine · 1961 osoba · 68 sedmica · NEJM 2021", 30, back((tb - T * 0.7) / 0.3, 3), TXT, INK)

def o_survey(img, d, tb, T):
    shade(img, (SAFE_L + 10, 220, W - SAFE_R - 10, 1010), 185)
    d.text((GCX, 245), "STALNE MISLI O HRANI", font=F(FXB, 56), fill=TXT, anchor="ma")
    base = 900; mh = 480
    t1 = T * 0.5; t2 = T * 0.78
    p1 = ease((tb - t1) / 0.7); p2 = ease((tb - t2) / 0.7)
    for cx, p, val, col, lab, t0 in [(GCX - 190, p1, 62, RED, "PRIJE", t1), (GCX + 190, p2, 16, GRN, "POSLIJE", t2)]:
        d.text((cx, base + 18), lab, font=F(FXB, 46), fill=SOFT, anchor="ma")
        if p <= 0: continue
        if at(tb, t0): sfx("boom" if val == 62 else "ding")
        h = mh * val / 62 * p
        d.rounded_rectangle((cx - 110, base - h, cx + 110, base), radius=22, fill=col, outline=INK, width=6)
        d.text((cx, base - h - 120), f"{int(round(val * p))}%", font=F(FXB, 104), fill=col, anchor="ma", stroke_width=8, stroke_fill=INK)
    tag(img, d, GCX, 1020, "anketa · 550 korisnika · EASD 2025", 34, back((tb - 0.3) / 0.25), TXT, INK)

def quote_card(img, d, lines, src, tb, y0=250):
    k = back(tb / 0.3, 2.6)
    if k <= 0: return
    if once(tb, 0.0): sfx("pop")
    h = 150 + len(lines) * 84 + 70
    x0, x1 = SAFE_L + 20, W - SAFE_R - 20
    d.rounded_rectangle((x0, y0, x1, y0 + h), radius=44, fill=TXT, outline=INK, width=7)
    d.text((x0 + 40, y0 - 6), "“", font=F(FXB, 200), fill=ACC)
    for i, s in enumerate(lines):
        d.text(((x0 + x1) / 2, y0 + 130 + i * 84), s, font=F(FXB, 62), fill=INK, anchor="ma")
    d.text(((x0 + x1) / 2, y0 + h - 62), src, font=F(FIN, 27), fill=(0x4B, 0x58, 0x69), anchor="ma")

def o_quote1(img, d, tb, T):
    quote_card(img, d, ["Cijeli moj svijet", "se vrtio oko hrane."], "pacijentica · studija Stanford · JAMA Netw Open 2026", tb)

def o_quote2(img, d, tb, T):
    quote_card(img, d, ["Dobar je osjećaj", "kad hrana više", "ne naređuje meni."], "učesnik studije · Stanford · JAMA Netw Open 2026", tb)

def o_notmagic(img, d, tb, T):
    k = back(tb / 0.28, 3)
    tag(img, d, GCX, 250, "NIJE ČAROBNI ŠTAPIĆ", 60, k, TXT, INK)
    a = back((tb - T * 0.45) / 0.28, 3)
    if a > 0:
        if at(tb, T * 0.45): sfx("pop")
        st(d, (GCX, 390), "I DALJE TI BIRAŠ", F(FXB, 84 * min(1.05, a)), TXT, sw=11)

def o_silence(img, d, tb, T):
    k = back(tb / 0.3, 3)
    if once(tb, 0.0): sfx("ding")
    st(d, (GCX, 260), "BIRAŠ U", F(FXB, 100 * min(1.05, k)), TXT, sw=12)
    st(d, (GCX, 380), "TIŠINI", F(FXB, 220 * min(1.05, k)), GRN, sw=14)

def o_future(img, d, tb, T):
    k = back(tb / 0.3, 3)
    if once(tb, 0.0): sfx("ding")
    st(d, (GCX, 250), "ZAMISLI", F(FXB, 140 * min(1.06, k)), YEL, sw=13)
    a = back((tb - 0.4) / 0.28, 3)
    if a > 0: tag(img, d, GCX, 430, "ISTO TO VEČE · 22:00", 56, a, INK, ACC)
    b = back((tb - T * 0.55) / 0.28, 3)
    if b > 0:
        if at(tb, T * 0.55): sfx("pop")
        tag(img, d, GCX, 560, "prođeš… i ne primijetiš", 48, b, TXT, INK)

def o_teaend(img, d, tb, T):
    k = back(tb / 0.3, 3)
    if once(tb, 0.0): sfx("pop")
    st(d, (GCX, 270), "ČAJ.", F(FXB, 130 * min(1.05, k)), TXT, sw=13)
    a = back((tb - T * 0.4) / 0.28, 3)
    if a > 0: st(d, (GCX, 420), "I SPAVANJE.", F(FXB, 110 * min(1.05, a)), GRN, sw=12)
    for i in range(6):
        ph = (tb * 0.4 + i * 0.17) % 1
        heart(d, SAFE_L + 70 + (i * 151) % 760, 1150 - ph * 520, 18 + (i % 3) * 8, RED)

def o_save(img, d, tb, T):
    k = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("pop")
    cx, y = GCX, 300; h = 230 * min(1.08, k)
    d.polygon([(cx - 85, y), (cx + 85, y), (cx + 85, y + h), (cx, y + h * 0.74), (cx - 85, y + h)], fill=YEL, outline=INK, width=8)
    st(d, (GCX, 570), "POŠALJI JOJ", F(FXB, 120 * min(1.05, k)), TXT, sw=12)
    a = back((tb - T * 0.55) / 0.28, 3)
    if a > 0:
        if at(tb, T * 0.55): sfx("ding")
        tag(img, d, GCX, 745, "NIJE DO NJE", 70, a, INK, ACC)

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

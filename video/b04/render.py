#!/usr/bin/env python3
"""Peptid Centar B02 V2: real footage + fast cuts + kinetic overlays + karaoke captions.
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
END_CARD = 1.6
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

# ------------------------------------------------------------------ overlays  fn(img, d, tb, T)
GRN = (0x3D, 0xE0, 0x7A)

def o_pregslam(img, d, tb, T):
    k = back(tb / 0.28, 3.0) if tb > 0.01 else 1.0
    shake = (1 - min(1, tb / 0.5)) * 12
    st(d, (GCX, 270), "HORMON IZ", F(FXB, 96), TXT, sw=11)
    st(d, (GCX + shake * math.sin(tb * 90), 390 + shake * math.cos(tb * 70)), "TRUDNOĆE", F(FXB, 168 * min(1.12, k)), YEL, sw=13)
    if once(tb, 0.0): sfx("boom")

def o_testo(img, d, tb, T):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("boom")
    tag(img, d, GCX, 260, "…KOJI MUŠKARCU PALI", 58, k, INK, ACC)
    st(d, (GCX, 390), "TESTOSTERON", F(FXB, 124 * min(1.08, k)), YEL, sw=12)
    st(d, (GCX, 560), "?!", F(FXB, 220 * min(1.08, k)), TXT, sw=13)

def o_hcgname(img, d, tb, T):
    k = back(tb / 0.28, 3)
    shade(img, (SAFE_L + 60, 290, W - SAFE_R - 60, 640), int(175 * min(1, k)))
    d.text((GCX, 300), "HCG", font=F(FXB, 230 * min(1.05, k)), fill=TXT, anchor="ma")
    d.text((GCX, 555), "humani horionski gonadotropin", font=F(FIN, 36), fill=ACC, anchor="ma")

def node(d, cx, y, text, k, fg=INK, bg=TXT, size=58):
    if k <= 0: return
    f = F(FXB, size * min(1.06, k)); w = d.textlength(text, font=f) + 80; h = f.size * 1.7
    d.rounded_rectangle((cx - w / 2, y, cx + w / 2, y + h), radius=h / 2, fill=bg)
    d.text((cx, y + h / 2), text, font=f, fill=fg, anchor="mm")

def flow(d, cx, y0, y1, tb, k, col):
    if k <= 0: return
    d.line((cx, y0, cx, y0 + (y1 - y0) * min(1, k)), fill=col, width=12)
    if k >= 1:
        d.polygon([(cx - 30, y1 - 6), (cx + 30, y1 - 6), (cx, y1 + 34)], fill=col)
        for q in range(3):
            ph = (tb * 1.4 + q / 3) % 1
            yy = y0 + (y1 - y0) * ph
            d.ellipse((cx - 16, yy - 16, cx + 16, yy + 16), fill=YEL)

def o_signal(img, d, tb, T):
    shade(img, (0, 0, W, H), 150, 0)
    cx = GCX - 110
    node(d, cx, 250, "MOZAG", back(tb / 0.25))
    flow(d, cx, 365, 500, tb, ease((tb - 0.25) / 0.35), ACC)
    node(d, cx, 545, "TESTISI", back((tb - 0.6) / 0.25))
    flow(d, cx, 660, 795, tb, ease((tb - 0.9) / 0.35), YEL)
    node(d, cx, 840, "TESTOSTERON", back((tb - 1.25) / 0.25, 3), INK, YEL, 62)
    if once(tb, 0.6) or once(tb, 1.25): sfx("pop")
    a = back((tb - 0.45) / 0.3, 3)
    if a > 0:
        d.text((cx + 60, 395), "signal (LH)", font=F(FIN, 38), fill=SOFT)
        tag(img, d, W - SAFE_R - 190, 470, "HCG", 84, a, INK, ACC)
        d.text((W - SAFE_R - 190, 610), "glumi isti", font=F(FXB, 40), fill=TXT, anchor="ma")
        d.text((W - SAFE_R - 190, 660), "signal", font=F(FXB, 40), fill=TXT, anchor="ma")

def o_own(img, d, tb, T):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("boom")
    tag(img, d, GCX, 260, "NE TUĐI HORMON", 62, k, TXT, RED)
    a = back((tb - T * 0.45) / 0.28, 3)
    if a > 0:
        if once(tb, T * 0.45): sfx("boom")
        st(d, (GCX, 400), "TVOJE TIJELO", F(FXB, 104 * min(1.05, a)), TXT, sw=12)
        st(d, (GCX, 530), "PRAVI SVOJ", F(FXB, 150 * min(1.05, a)), YEL, sw=13)

def o_why(img, d, tb, T):
    k = back(tb / 0.25, 3)
    st(d, (GCX, 330), "ZAŠTO JE", F(FXB, 120 * min(1.05, k)), TXT, sw=12)
    st(d, (GCX, 470), "BITNO?", F(FXB, 170 * min(1.05, k)), YEL, sw=13)

def gauge(d, cx, cy, r, lvl, col):
    d.arc((cx - r, cy - r, cx + r, cy + r), 180, 360, fill=(0x44, 0x55, 0x6A), width=34)
    d.arc((cx - r, cy - r, cx + r, cy + r), 180, 180 + 180 * max(0.02, lvl), fill=col, width=34)
    ang = math.pi * (1 - lvl)
    d.line((cx, cy, cx + (r - 50) * math.cos(ang), cy - (r - 50) * math.sin(ang)), fill=TXT, width=14)
    d.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill=TXT)

def o_factoryoff(img, d, tb, T):
    p = ease((tb - 0.2) / max(0.8, T * 0.7))
    shade(img, (0, 0, W, H), int(60 + 150 * p), 0)
    lvl = 1 - 0.94 * p
    gauge(d, GCX, 560, 250, lvl, GRN if lvl > 0.6 else (YEL if lvl > 0.3 else RED))
    st(d, (GCX, 250), "VLASTITA TVORNICA", F(FXB, 62), TXT, sw=9)
    a = back((tb - T * 0.55) / 0.28, 3)
    if a > 0:
        if once(tb, T * 0.55): sfx("boom")
        tag(img, d, GCX, 640, "SE GASI", 110, a, TXT, RED)
    if p < 1 and tb > 0.2 and int(tb * 10) != int((tb - 1 / FPS) * 10): sfx("tick")

def o_m94(img, d, tb, T):
    k = back(tb / 0.25, 3)
    shake = (1 - min(1, tb / 0.5)) * 14
    if once(tb, 0.0): sfx("boom")
    p = ease(tb / max(0.6, T * 0.5))
    st(d, (GCX + shake * math.sin(tb * 90), 290 + shake * math.cos(tb * 70)), f"−{int(round(94 * p))}%", F(FXB, 300 * min(1.1, k)), RED, sw=14)
    st(d, (GCX, 660), "TESTOSTERON U TESTISIMA", F(FXB, 56), TXT, sw=9)
    tag(img, d, GCX, 770, "studija · JCEM 2005", 40, back((tb - 0.4) / 0.25), TXT, INK)

def check(d, cx, cy, s, col):
    d.ellipse((cx - 110 * s, cy - 110 * s, cx + 110 * s, cy + 110 * s), fill=col, outline=INK, width=8)
    d.line((cx - 52 * s, cy + 2 * s, cx - 12 * s, cy + 44 * s, cx + 58 * s, cy - 40 * s), fill=INK, width=int(26 * s), joint="curve")

def o_factoryon(img, d, tb, T):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("ding")
    tag(img, d, GCX, 250, "UZ HCG", 80, k, INK, ACC)
    p = ease((tb - 0.2) / max(0.6, T * 0.5))
    gauge(d, GCX, 640, 230, 0.06 + 0.94 * p, GRN if p > 0.6 else YEL)
    a = back((tb - T * 0.45) / 0.28, 3)
    if a > 0:
        if once(tb, T * 0.45): sfx("pop")
        st(d, (GCX, 700), "TVORNICA RADI", F(FXB, 104 * min(1.05, a)), GRN, sw=12)

def o_fert(img, d, tb, T):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("ding")
    check(d, GCX, 380, min(1.1, k), GRN)
    st(d, (GCX, 530), "PLODNOST", F(FXB, 130 * min(1.05, k)), TXT, sw=12)
    st(d, (GCX, 680), "SAČUVANA", F(FXB, 130 * min(1.05, k)), GRN, sw=12)
    tag(img, d, GCX, 850, "26 muškaraca · J Urol 2013", 38, back((tb - 0.4) / 0.25), TXT, INK)

def o_libido(img, d, tb, T):
    k = back(tb / 0.25, 3)
    st(d, (GCX, 250), "8 OD 10", F(FXB, 210 * min(1.06, k)), YEL, sw=13)
    for i in range(10):
        a = back((tb - 0.3 - i * 0.09) / 0.2, 3)
        if a <= 0: continue
        if once(tb, 0.3 + i * 0.09): sfx("tick")
        x = GCX - 4.5 * 78 + i * 78; y = 560; col = ACC if i < 8 else (0x55, 0x66, 0x7A)
        r = 26 * min(1.1, a)
        d.ellipse((x - r, y - r, x + r, y + r), fill=col, outline=INK, width=5)
        d.rounded_rectangle((x - r, y + r + 6, x + r, y + r + 80 * min(1, a)), radius=20, fill=col, outline=INK, width=5)
    st(d, (GCX, 710), "BOLJI LIBIDO", F(FXB, 110), TXT, sw=12)
    tag(img, d, GCX, 860, "studija · samo HCG · 2022", 38, back((tb - 1.0) / 0.25), TXT, INK)
    for i in range(6):
        ph = (tb * 0.5 + i * 0.17) % 1
        heart(d, SAFE_L + 70 + (i * 151) % 760, 1150 - ph * 500, 20 + (i % 3) * 8, RED)

def heart(d, x, y, s, col):
    d.ellipse((x - s, y - s, x, y), fill=col); d.ellipse((x, y - s, x + s, y), fill=col)
    d.polygon([(x - s * 0.96, y - s * 0.3), (x + s * 0.96, y - s * 0.3), (x, y + s * 0.95)], fill=col)

def o_banned(img, d, tb, T):
    k = back(tb / 0.25, 3)
    tag(img, d, GCX, 250, "TOLIKO JE MOĆAN", 66, k, INK, YEL)
    a = back((tb - T * 0.4) / 0.3, 3)
    if a > 0:
        if once(tb, T * 0.4): sfx("boom")
        lay = Image.new("RGBA", (820, 380), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
        ld.rounded_rectangle((8, 8, 812, 372), radius=30, outline=RED + (255,), width=14)
        ld.text((410, 50), "ZABRANJEN", font=F(FXB, 124), fill=RED + (255,), anchor="ma")
        ld.text((410, 210), "muškarcima u sportu", font=F(FXB, 56), fill=TXT + (255,), anchor="ma")
        ld.text((410, 290), "WADA · lista 2026", font=F(FIN, 40), fill=TXT + (255,), anchor="ma")
        sc = 1.7 - 0.7 * min(1, a) if a < 1 else 1.0
        lay = lay.resize((int(820 * sc), int(380 * sc)), Image.BILINEAR).rotate(-6, expand=True, resample=Image.BICUBIC)
        shade(img, (SAFE_L, 400, W - SAFE_R, 900), 130)
        img.paste(lay, (int(GCX - lay.width / 2), int(650 - lay.height / 2)), lay)

def o_save(img, d, tb, T):
    k = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("pop")
    cx, y = GCX, 300; h = 230 * min(1.08, k)
    d.polygon([(cx - 85, y), (cx + 85, y), (cx + 85, y + h), (cx, y + h * 0.74), (cx - 85, y + h)], fill=YEL, outline=INK, width=8)
    st(d, (GCX, 570), "SAČUVAJ", F(FXB, 130 * min(1.05, k)), TXT, sw=12)
    tag(img, d, GCX, 745, "+ POŠALJI DRUGU", 60, back((tb - T * 0.4) / 0.28), INK, ACC)

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

def end_card(img, p):
    d = ImageDraw.Draw(img); k = ease(p * 3)
    mixc = lambda c: tuple(int(BG[i] + (c[i] - BG[i]) * k) for i in range(3))
    lg = logo_img(360).copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v * k))); img.paste(lg, (GCX - 180, 480), lg)
    d.text((GCX, 900), "Peptidi bez hajpa", font=F(FXB, 64), fill=mixc(ACC), anchor="ma")
    d.text((GCX, 1000), "@peptidcentar", font=F(FXB, 48), fill=mixc(TXT), anchor="ma")
    d.text((GCX, 1180), "Edukacija · nije medicinski savjet", font=F(FIN, 40), fill=mixc(SOFT), anchor="ma")

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
            frame = Image.new("RGB", (W, H), BG); end_card(frame, (t - speech_end) / END_CARD)
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

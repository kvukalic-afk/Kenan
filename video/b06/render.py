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

# ------------------------------------------------------------------ overlays  fn(img, d, tb, T)
GRN = (0x3D, 0xE0, 0x7A)
import random, colorsys
PACK = os.path.join(HERE, "..", "brand", "helvera", "pack")
_pk = {}
def pk(name):
    if name not in _pk: _pk[name] = Image.open(os.path.join(PACK, name)).convert("RGB")
    return _pk[name]
def crop(im, x0, y0, x1, y1): return im.crop((int(x0 * im.width), int(y0 * im.height), int(x1 * im.width), int(y1 * im.height)))

def pcard(img, im, cx, cy, w, k, maxh=None, border=None, bw=9, radius=26):
    if k <= 0.03: return None
    iw, ih = im.size; h = int(ih * w / iw)
    if maxh and h > maxh: w = int(iw * maxh / ih); h = maxh
    s = min(1.07, k); W2, H2 = max(8, int(w * s)), max(8, int(h * s))
    pic = im.convert("RGB").resize((W2, H2), Image.LANCZOS); pad = bw if border else 0
    cv = Image.new("RGB", (W2 + 2 * pad, H2 + 2 * pad), border or (255, 255, 255)); cv.paste(pic, (pad, pad))
    m = Image.new("L", cv.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, cv.width - 1, cv.height - 1), radius=radius, fill=255)
    sh = Image.new("RGBA", (cv.width + 70, cv.height + 70), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((35, 44, 35 + cv.width, 44 + cv.height), radius=radius, fill=(0, 0, 0, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(16))
    x, y = int(cx - cv.width / 2), int(cy - cv.height / 2)
    img.paste(sh, (x - 35, y - 35), sh); img.paste(cv, (x, y), m)
    return x, y, cv.width, cv.height

def mark(d, cx, cy, ok, k):
    if k <= 0: return
    r = 54 * min(1.1, k); col = GRN if ok else RED
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col, outline=INK, width=6)
    if ok: d.line((cx - 24, cy + 2, cx - 6, cy + 22, cx + 28, cy - 20), fill=INK, width=14, joint="curve")
    else:
        d.line((cx - 22, cy - 22, cx + 22, cy + 22), fill=INK, width=14); d.line((cx - 22, cy + 22, cx + 22, cy - 22), fill=INK, width=14)

def mock_tiny():
    im = Image.new("RGB", (760, 300), (250, 250, 250)); d = ImageDraw.Draw(im); f = F(FIN, 12); rnd = random.Random(3)
    for r in range(18): d.text((14, 10 + r * 15), "".join(rnd.choice("abcdefghijklmnoprstuvz 0123456789.,") for _ in range(88)), font=f, fill=(150, 150, 150))
    return im
def mock_nocompany():
    im = Image.new("RGB", (760, 300), (250, 250, 250)); d = ImageDraw.Draw(im)
    d.text((40, 36), "PEPTID 5 mg", font=F(FXB, 64), fill=(70, 70, 70)); d.text((40, 126), "prašak za rastvor", font=F(FIN, 34), fill=(130, 130, 130))
    d.rounded_rectangle((40, 188, 720, 268), radius=14, outline=(210, 60, 60), width=5)
    d.text((380, 228), "proizvođač: ???   adresa: ???", font=F(FIN, 34), fill=(210, 60, 60), anchor="mm"); return im
def mock_holo():
    im = Image.new("RGB", (760, 300)); d = ImageDraw.Draw(im)
    for x in range(760):
        r, g, b = colorsys.hsv_to_rgb(((x / 760) * 1.3) % 1, 0.65, 1.0); d.line((x, 0, x, 300), fill=(int(r * 255), int(g * 255), int(b * 255)))
    d.text((380, 120), "RESEARCH", font=F(FXB, 78), fill=(255, 255, 255), anchor="mm", stroke_width=5, stroke_fill=(120, 0, 160))
    d.text((380, 210), "USE ONLY", font=F(FXB, 78), fill=(255, 255, 255), anchor="mm", stroke_width=5, stroke_fill=(120, 0, 160)); return im
def mock_lone():
    return crop(pk("bocica.jpg"), 0.45, 0.06, 0.80, 0.95)
def mock_nolot():
    im = Image.new("RGB", (760, 300), (250, 250, 250)); d = ImageDraw.Draw(im)
    d.text((40, 36), "BPC-157 5 mg", font=F(FXB, 64), fill=(70, 70, 70))
    d.text((40, 140), "LOT: —       EXP: —", font=F(FXB, 56), fill=(150, 150, 150)); d.text((40, 220), "kod za provjeru: nema", font=F(FIN, 40), fill=(210, 60, 60)); return im

def flagbar(img, d, tb, n, text):
    k = back(tb / 0.25, 3)
    if once(tb, 0.0): sfx("boom")
    tag(img, d, GCX, 232, f"ZNAK {n}", 52, k, TXT, RED)
    fs = 58.0
    w0 = d.textlength(text, font=F(FXB, 58))
    if w0 > 880: fs = 58 * 880 / w0
    st(d, (GCX, 340), text, F(FXB, fs * min(1.04, k)), TXT, sw=9)

def sign(img, d, tb, T, n, text, bad, good, good_w=900, good_h=430, label="ISPRAVNO"):
    flagbar(img, d, tb, n, text)
    ka = back((tb - 0.15) / 0.3, 2.5)
    r = pcard(img, bad, GCX, 590, 780, ka, maxh=290, border=(0xE5, 0x4B, 0x4B))
    if r: mark(d, r[0] + r[2] - 14, r[1] + 14, False, back((tb - 0.45) / 0.25, 3))
    at = T * 0.45; kb = back((tb - at) / 0.3, 2.5)
    if kb > 0:
        if once(tb, at): sfx("pop")
        lsz = 40 if len(label) < 14 else 32
        tag(img, d, GCX, 770, label, lsz, min(1, kb), INK, GRN)
        r2 = pcard(img, good, GCX, 1030, good_w, kb, maxh=good_h, border=GRN)
        if r2: mark(d, r2[0] + r2[2] - 14, r2[1] + 14, True, back((tb - at - 0.3) / 0.25, 3))
        d.text((GCX, 1262), "ilustrativni 3D prikaz · HELVERA (uskoro)", font=F(FIN, 26), fill=SOFT, anchor="ma")

def o_hook5(img, d, tb, T):
    k = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("boom")
    st(d, (GCX, 235), "ZNAKOVA SUMNJIVOG", F(FXB, 62), TXT, sw=9); st(d, (GCX, 315), "PAKOVANJA", F(FXB, 62), TXT, sw=9)
    pcard(img, pk("hero_kutija_bocica.jpg"), GCX, 810, 880, back((tb - 0.15) / 0.4, 2.2), maxh=760)
    st(d, (GCX - 330, 530), "5", F(FXB, 300 * min(1.12, k)), YEL, sw=14, anchor="ma")
def o_sign1(img, d, tb, T): sign(img, d, tb, T, 1, "SITAN TEKST", mock_tiny(), crop(pk("naljepnica.png"), 0.0, 0.0, 0.62, 1.0), 940, 470)
def o_sign2(img, d, tb, T): sign(img, d, tb, T, 2, "BEZ IMENA I ADRESE", mock_nocompany(), crop(pk("naljepnica.png"), 0.62, 0.0, 1.0, 1.0), 700, 480, "IME FIRME NA BOČICI")
def o_sign3(img, d, tb, T): sign(img, d, tb, T, 3, "HOLOGRAM · NEON · „ISTRAŽIVANJE“", mock_holo(), crop(pk("asortiman.jpg"), 0.08, 0.12, 0.92, 0.88), 980, 470, "MIRNO I ČISTO")
def o_sign4(img, d, tb, T): sign(img, d, tb, T, 4, "BOČICA BEZ KUTIJE", mock_lone(), pk("komplet.jpg"), 980, 480, "KUTIJA · BOČICE · UPUTSTVO")
def o_sign5(img, d, tb, T): sign(img, d, tb, T, 5, "NEMA PROVJERE SERIJE", mock_nolot(), pk("dno.jpg"), 800, 480, "SERIJA · ROK · KOD ZA PROVJERU")

def o_right(img, d, tb, T):
    k = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("ding")
    tag(img, d, GCX, 236, "A PRAVO PAKOVANJE?", 62, k, INK, GRN)
    pcard(img, pk("kutija.jpg"), GCX, 590, 760, back((tb - 0.1) / 0.35, 2.2), maxh=430, border=GRN)
    items = ["naziv i doza, krupno", "ime firme", "serija i rok", "uputstvo u kutiji", "kod za provjeru"]
    for i, s in enumerate(items):
        at = 0.45 + i * (T * 0.14); a = back((tb - at) / 0.25, 3)
        if a <= 0: continue
        if once(tb, at): sfx("tick")
        y = 850 + i * 82; x = SAFE_L + 90
        d.ellipse((x - 26, y + 4, x + 26, y + 56), fill=GRN, outline=INK, width=5)
        d.line((x - 11, y + 31, x - 3, y + 42, x + 14, y + 17), fill=INK, width=8, joint="curve")
        st(d, (x + 56, y + 6), s.upper(), F(FXB, 44), TXT, sw=8, anchor="la")

def o_reveal1(img, d, tb, T):
    k = back(tb / 0.4, 1.6)
    if once(tb, 0.0): sfx("ding")
    for i, s in enumerate(["OVAKO IZGLEDA PAKOVANJE", "NA KOJEM RADIMO"]):
        st(d, (GCX, 236 + i * 70), s, F(FXB, 54), TXT, sw=8)
    pcard(img, pk("otvaranje.jpg"), GCX, 800, 1000, k, maxh=760)
    d.text((GCX, 1196), "ilustrativni 3D prikaz", font=F(FIN, 30), fill=SOFT, anchor="ma")

def o_reveal2(img, d, tb, T):
    k = back(tb / 0.4, 1.6)
    pcard(img, pk("asortiman.jpg"), GCX, 740, 1000, k, maxh=560)
    a = ease((tb - 0.35) / 0.5)
    if a > 0:
        lg = Image.open(os.path.join(HERE, "..", "brand", "helvera", "helvera_logo_negativ.png")).convert("RGBA")
        w = 700; lg = lg.resize((w, int(lg.height * w / lg.width)), Image.LANCZOS)
        lg.putalpha(lg.split()[3].point(lambda v: int(v * a))); img.paste(lg, (int(GCX - w / 2), 1010), lg)
        d.text((GCX, 1118), "USKORO", font=F(FIN, 40), fill=tuple(int(BG[i] + (TXT[i] - BG[i]) * a) for i in range(3)), anchor="ma")
    d.text((GCX, 1196), "ilustrativni 3D prikaz", font=F(FIN, 30), fill=SOFT, anchor="ma")

def o_follow(img, d, tb, T):
    k = back(tb / 0.3, 3)
    if once(tb, 0.0): sfx("pop")
    sz = max(8, int(260 * min(1.06, k))); lg = logo_img(sz)
    img.paste(lg, (GCX - sz // 2, 320 + (260 - sz) // 2), lg)
    st(d, (GCX, 620), "PRATI", F(FXB, 120), TXT, sw=12)
    tag(img, d, GCX, 780, "@peptidcentar", 66, back((tb - 0.25) / 0.28), INK, ACC)

def o_save(img, d, tb, T):
    k = back(tb / 0.28, 3)
    if once(tb, 0.0): sfx("pop")
    cx, y = GCX, 300; h = 230 * min(1.08, k)
    d.polygon([(cx - 85, y), (cx + 85, y), (cx + 85, y + h), (cx, y + h * 0.74), (cx - 85, y + h)], fill=YEL, outline=INK, width=8)
    st(d, (GCX, 570), "SAČUVAJ", F(FXB, 130 * min(1.05, k)), TXT, sw=12)
    tag(img, d, GCX, 745, "+ PODIJELI", 60, back((tb - T * 0.4) / 0.28), INK, ACC)

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
        if clip.startswith("img:"):
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", "30", "-i", os.path.join(ST, clip[4:]),
                            "-t", f"{be - bs + 0.05:.3f}", "-vf", "scale=1080:1920,fps=30,setsar=1", "-frames:v", str(int(round((be - bs) * FPS))),
                            "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-pix_fmt", "yuv420p", out], check=True)
            parts.append(out); continue
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

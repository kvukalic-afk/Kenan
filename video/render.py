#!/usr/bin/env python3
"""Peptid Centar - TikTok renderer (GHK-Cu, B01).

Renders 1080x1920 frames with PIL and pipes them into ffmpeg.
Timing comes from timing.json (one entry per narration sentence),
which make.sh builds from the voice track via silencedetect.

Usage: python3 render.py timing.json voice.wav out_dir
"""
import json, math, sys, subprocess, os
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_XB = os.path.join(HERE, "fonts", "Manrope-ExtraBold.ttf")
FONT_IN = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
if not os.path.exists(FONT_IN):
    FONT_IN = os.path.join(HERE, "fonts", "Manrope-ExtraBold.ttf")

# Paleta A: grafit + bakar
BG = (0x1F, 0x22, 0x26)
TXT = (0xF5, 0xF0, 0xE8)
PANEL = (0x2E, 0x32, 0x38)
ACC = (0xB8, 0x73, 0x33)
MUTED = (0x8C, 0x8F, 0x94)

# Safe zones (TikTok UI): no text in top 220, bottom 420, right 140 px
SAFE_T, SAFE_B, SAFE_R, SAFE_L = 220, 420, 140, 70
SUB_Y0, SUB_Y1 = 1150, 1480
END_CARD = 2.0

_fc = {}
def font(path, size):
    k = (path, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]

def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

# ---------------------------------------------------------------- script
# subtitle text (original names, digits) | accent words | graphic id
SCRIPT = [
    ("Šta bakreni peptid stvarno radi za fine bore?", ["fine", "bore?"], "hook"),
    ("Vidi, prije nego povjeruješ reklami, moraš znati jednu brojku.", ["jednu", "brojku."], "loop"),
    ("U jednoj studiji, 40 žena, od 40 do 65 godina, mazalo je serum s GHK-Cu 8 sedmica.", ["8", "sedmica."], "study"),
    ("Jedna strana lica dobila je peptid, druga običan serum.", ["peptid,"], "split"),
    ("Volumen bora pao je za skoro 56% u odnosu na običan serum.", ["56%"], "result"),
    ("E sad, studija je mala, a serum je dao proizvođač.", ["mala,"], "limits"),
    ("Zato je ovo nivo 3 od 5.", ["nivo", "3"], "scale"),
    ("Šta to znači u praksi?", ["u", "praksi?"], "practice"),
    ("Bakreni peptid u kremi ima zanimljive rezultate na ljudima, ali velike studije još čekamo.", ["još", "čekamo."], "answer"),
    ("Sačuvaj, i prati za sljedeći peptid.", ["Sačuvaj,"], "cta"),
]

# ---------------------------------------------------------------- text utils
def text_w(d, s, f):
    return d.textlength(s, font=f)

def draw_center(d, y, s, f, fill, x0=SAFE_L, x1=W - SAFE_R):
    w = text_w(d, s, f)
    d.text(((x0 + x1 - w) / 2, y), s, font=f, fill=fill)

def chunk_words(text, max_chars=22, max_words=4):
    words, chunks, cur = text.split(), [], []
    for w in words:
        trial = " ".join(cur + [w])
        if cur and (len(trial) > max_chars or len(cur) >= max_words):
            chunks.append(cur); cur = [w]
        else:
            cur.append(w)
    if cur:
        chunks.append(cur)
    # avoid 1-word orphan at end
    if len(chunks) > 1 and len(chunks[-1]) == 1 and len(" ".join(chunks[-2] + chunks[-1])) <= max_chars:
        last = chunks.pop()
        chunks[-1] = chunks[-1] + last
    return chunks

def build_subs(timing):
    subs = []
    for (text, acc, _), seg in zip(SCRIPT, timing):
        chunks = chunk_words(text)
        total = sum(len(" ".join(c)) for c in chunks)
        t = seg["start"]
        dur = seg["end"] - seg["start"]
        for c in chunks:
            d = dur * len(" ".join(c)) / total
            subs.append({"start": t, "end": t + d, "words": c, "acc": acc})
            t += d
    return subs

def draw_sub(d, sub, t):
    f = font(FONT_XB, 76)
    words = sub["words"]
    # 1 line if fits, else 2
    line = " ".join(words)
    lines = [words] if text_w(d, line, f) <= (W - SAFE_L - SAFE_R - 80) else [words[: math.ceil(len(words) / 2)], words[math.ceil(len(words) / 2):]]
    lh = 96
    block_h = lh * len(lines)
    y = SUB_Y0 + (SUB_Y1 - SUB_Y0 - block_h) / 2
    # pop-in
    k = ease((t - sub["start"]) / 0.12)
    # translucent band
    maxw = max(text_w(d, " ".join(l), f) for l in lines)
    cx = (SAFE_L + W - SAFE_R) / 2
    pad = 34
    d.rounded_rectangle((cx - maxw / 2 - pad, y - 18, cx + maxw / 2 + pad, y + block_h + 6), radius=22, fill=(0x17, 0x19, 0x1C))
    for i, l in enumerate(lines):
        lw = text_w(d, " ".join(l), f)
        x = cx - lw / 2
        yy = y + i * lh + (1 - k) * 18
        for w in l:
            col = ACC if w in sub["acc"] else TXT
            d.text((x, yy), w, font=f, fill=lerp(BG, col, k))
            x += text_w(d, w + " ", f)

# ---------------------------------------------------------------- graphics
GX0, GX1 = SAFE_L, W - SAFE_R
GCX = (GX0 + GX1) / 2

def molecule(d, cx, cy, p, scale=1.0, labels=True):
    # GHK-Cu: G-H-K beads in a chain + copper bead
    r = 62 * scale
    pts = [(cx - 230 * scale, cy + 40 * scale), (cx - 75 * scale, cy - 40 * scale), (cx + 80 * scale, cy + 40 * scale)]
    cu = (cx + 215 * scale, cy - 55 * scale)
    fl = font(FONT_XB, int(46 * scale))
    for i, (x, y) in enumerate(pts):
        k = ease(p * 3 - i * 0.5)
        if i:
            px, py = pts[i - 1]
            d.line((px, py, px + (x - px) * k, py + (y - py) * k), fill=MUTED, width=int(6 * scale))
    for i, (x, y) in enumerate(pts):
        k = ease(p * 3 - i * 0.5)
        if k <= 0: continue
        rr = r * k
        d.ellipse((x - rr, y - rr, x + rr, y + rr), outline=TXT, width=int(5 * scale), fill=PANEL)
        if labels and k > 0.6:
            s = "GHK"[i]
            d.text((x - text_w(d, s, fl) / 2, y - 30 * scale), s, font=fl, fill=TXT)
    k = ease(p * 3 - 1.6)
    if k > 0:
        x, y = cu
        d.line((pts[2][0], pts[2][1], pts[2][0] + (x - pts[2][0]) * k, pts[2][1] + (y - pts[2][1]) * k), fill=ACC, width=int(6 * scale))
        rr = r * 0.9 * k
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=ACC)
        if labels and k > 0.6:
            d.text((x - text_w(d, "Cu", fl) / 2, y - 30 * scale), "Cu", font=fl, fill=BG)

def scale_dots(d, cx, y, level, p, size=46, gap=40):
    total = 5 * size + 4 * gap
    x = cx - total / 2
    for i in range(5):
        k = ease(p * 2.2 - i * 0.18)
        filled = i < level and k > 0.5
        bx = x + i * (size + gap)
        if filled:
            d.ellipse((bx, y, bx + size, y + size), fill=ACC)
        else:
            d.ellipse((bx, y, bx + size, y + size), outline=MUTED, width=4)

def g_hook(d, p, t):
    fh = font(FONT_XB, 92)
    k = ease(p * 4)
    draw_center(d, 300 + (1 - k) * 30, "FINE BORE", fh, lerp(BG, ACC, k))
    draw_center(d, 410 + (1 - k) * 30, "+ BAKRENI", fh, lerp(BG, TXT, k))
    draw_center(d, 520 + (1 - k) * 30, "PEPTID?", fh, lerp(BG, TXT, k))
    molecule(d, GCX, 860, p * 1.4)

def g_loop(d, p, t):
    f = font(FONT_XB, 300)
    k = ease(p * 3)
    s = "??%"
    draw_center(d, 420 + (1 - k) * 40, s, f, lerp(BG, ACC, k))
    fs = font(FONT_IN, 44)
    draw_center(d, 820, "prije reklame: jedna brojka", fs, lerp(BG, MUTED, k))

def person(d, x, y, s, col):
    d.ellipse((x - 16 * s, y, x + 16 * s, y + 32 * s), fill=col)
    d.rounded_rectangle((x - 24 * s, y + 38 * s, x + 24 * s, y + 92 * s), radius=int(18 * s), fill=col)

def g_study(d, p, t):
    # 40 people grid 8x5
    k = p * 1.3
    for i in range(40):
        r, c = divmod(i, 8)
        a = ease(k * 3 - i * 0.04)
        if a <= 0: continue
        person(d, GX0 + 105 + c * 96, 300 + r * 96, 0.85, lerp(BG, TXT if i % 2 == 0 else (0xD9, 0xD3, 0xC9), a))
    fs = font(FONT_XB, 58)
    items = [("40", "žena"), ("40–65", "godina"), ("8", "sedmica")]
    for j, (n, lbl) in enumerate(items):
        a = ease(k * 2.5 - 1.0 - j * 0.25)
        if a <= 0: continue
        cx_ = GX0 + 140 + j * 290
        f84 = font(FONT_XB, 80)
        d.text((cx_ - text_w(d, n, f84) / 2, 800), n, font=f84, fill=lerp(BG, ACC, a))
        f40 = font(FONT_IN, 40)
        d.text((cx_ - text_w(d, lbl, f40) / 2, 895), lbl, font=f40, fill=lerp(BG, TXT, a))

def g_split(d, p, t):
    cx, cy = GCX, 610
    k = ease(p * 2.5)
    # face outline
    d.ellipse((cx - 230, cy - 300, cx + 230, cy + 300), outline=TXT, width=6)
    # split line
    d.line((cx, cy - 330, cx, cy - 330 + 660 * k), fill=MUTED, width=4)
    a = ease(p * 3 - 0.6)
    if a > 0:
        # left half tint (peptid)
        ov = Image.new("RGBA", d._image.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        od.pieslice((cx - 224, cy - 294, cx + 224, cy + 294), 90, 270, fill=ACC + (int(70 * a),))
        d._image.paste(Image.alpha_composite(d._image.convert("RGBA"), ov).convert("RGB"))
        fl = font(FONT_XB, 40)
        for lbl, ccx, col in (("GHK-Cu", cx - 125, ACC), ("običan serum", cx + 135, MUTED)):
            d.text((ccx - text_w(d, lbl, fl) / 2, cy + 335), lbl, font=fl, fill=lerp(BG, col, a))

def g_result(d, p, t):
    k = ease(p * 2.2)
    val = 55.8 * k
    s = f"−{val:.1f}".replace(".", ",") + "%"
    draw_center(d, 360, s, font(FONT_XB, 210), ACC)
    fs = font(FONT_XB, 50)
    a = ease(p * 3 - 0.8)
    draw_center(d, 640, "volumen bora", fs, lerp(BG, TXT, a))
    draw_center(d, 710, "u odnosu na običan serum", font(FONT_IN, 42), lerp(BG, MUTED, a))
    # simple bar comparison
    by = 790
    bw = 640
    x0 = GCX - bw / 2
    d.rounded_rectangle((x0, by, x0 + bw, by + 46), radius=23, fill=MUTED)
    d.text((x0, by + 60), "kontrola", font=font(FONT_IN, 36), fill=MUTED)
    d.rounded_rectangle((x0, by + 130, x0 + bw * (1 - 0.558 * k), by + 176), radius=23, fill=ACC)
    d.text((x0, by + 190), "GHK-Cu serum", font=font(FONT_IN, 36), fill=TXT)

def g_limits(d, p, t):
    fs = font(FONT_XB, 64)
    rows = [("n = 40", "mala studija"), ("8 sedmica", "kratko trajanje"), ("serum dao", "proizvođač")]
    for i, (a_, b_) in enumerate(rows):
        a = ease(p * 3 - i * 0.45)
        if a <= 0: continue
        y = 330 + i * 230
        d.rounded_rectangle((GX0 + 20, y, GX1 - 20, y + 180), radius=28, outline=lerp(BG, PANEL, a), width=4, fill=lerp(BG, PANEL, a * 0.6))
        d.text((GX0 + 60, y + 30), a_, font=fs, fill=lerp(BG, TXT, a))
        d.text((GX0 + 60, y + 108), b_, font=font(FONT_IN, 40), fill=lerp(BG, MUTED, a))

def g_scale(d, p, t):
    draw_center(d, 300, "SKALA DOKAZA", font(FONT_XB, 60), TXT)
    scale_dots(d, GCX, 460, 3, p * 1.5, size=80, gap=50)
    labels = ["Ćelije", "Životinje", "Ljudi, mala studija", "Ljudi, velika kontrolisana", "Odobreno"]
    for i, l in enumerate(labels):
        a = ease(p * 3 - 0.5 - i * 0.12)
        col = ACC if i == 2 else (TXT if i < 2 else MUTED)
        d.text((GX0 + 60, 640 + i * 78), f"{i + 1}  {l}", font=font(FONT_IN if i != 2 else FONT_XB, 44), fill=lerp(BG, col, a))

def g_practice(d, p, t):
    # path cell -> rat -> human
    steps = ["ćelija", "pacov", "čovjek"]
    for i, s in enumerate(steps):
        a = ease(p * 3 - i * 0.4)
        x = GX0 + 90 + i * 290
        y = 560
        col = ACC if i == 2 else TXT
        d.ellipse((x - 70, y - 70, x + 70, y + 70), outline=lerp(BG, col, a), width=6)
        w = text_w(d, s, font(FONT_XB, 42))
        d.text((x - w / 2, y + 100), s, font=font(FONT_XB, 42), fill=lerp(BG, col, a))
        if i:
            d.line((x - 220, y, x - 220 + 150 * a, y), fill=MUTED, width=5)
    draw_center(d, 320, "U PRAKSI?", font(FONT_XB, 96), TXT)

def g_answer(d, p, t):
    # graph with one line: rising then dashed (unknown)
    x0, y0, x1, y1 = GX0 + 40, 360, GX1 - 40, 900
    d.line((x0, y1, x1, y1), fill=MUTED, width=4)
    d.line((x0, y0, x0, y1), fill=MUTED, width=4)
    k = ease(p * 1.6)
    pts = [(x0, y1 - 40), (x0 + 200, y1 - 150), (x0 + 420, y1 - 290)]
    for i in range(len(pts) - 1):
        a = max(0, min(1, k * 2 - i * 0.5))
        (ax, ay), (bx, by) = pts[i], pts[i + 1]
        d.line((ax, ay, ax + (bx - ax) * a, ay + (by - ay) * a), fill=ACC, width=8)
    if k > 0.7:
        # dashed future
        ax, ay = pts[-1]
        for j in range(6):
            sx = ax + j * 50
            d.line((sx, ay - j * 18, sx + 28, ay - j * 18 - 10), fill=MUTED, width=6)
        d.text((x1 - 300, y0 - 10), "velike studije?", font=font(FONT_IN, 38), fill=MUTED)
    d.text((x0 + 20, y1 + 20), "male studije na ljudima", font=font(FONT_IN, 36), fill=TXT)

def g_cta(d, p, t):
    k = ease(p * 3)
    # bookmark icon
    cx, y = GCX, 380
    d.polygon([(cx - 90, y), (cx + 90, y), (cx + 90, y + 260), (cx, y + 190), (cx - 90, y + 260)], fill=lerp(BG, ACC, k))
    draw_center(d, 730, "SAČUVAJ", font(FONT_XB, 96), lerp(BG, TXT, k))
    draw_center(d, 850, "prati za sljedeći peptid", font(FONT_IN, 46), lerp(BG, MUTED, k))

G = {"hook": g_hook, "loop": g_loop, "study": g_study, "split": g_split, "result": g_result,
     "limits": g_limits, "scale": g_scale, "practice": g_practice, "answer": g_answer, "cta": g_cta}

# ---------------------------------------------------------------- brand
def logo_mark(d, x, y, s=1.0, col=ACC):
    r = 30 * s
    d.ellipse((x, y, x + 2 * r, y + 2 * r), outline=col, width=max(2, int(5 * s)))
    # three dots = chain
    for i in range(3):
        cx = x + r - 14 * s + i * 14 * s
        d.ellipse((cx - 4 * s, y + r - 4 * s, cx + 4 * s, y + r + 4 * s), fill=col)

def draw_logo(img, alpha):
    ov = Image.new("RGBA", (420, 90), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    logo_mark(od, 0, 10, 1.0, ACC + (255,))
    od.text((78, 20), "PEPTID CENTAR", font=font(FONT_XB, 34), fill=TXT + (255,))
    a = ov.split()[3].point(lambda v: int(v * alpha))
    ov.putalpha(a)
    img.paste(ov, (SAFE_L, 240), ov)

def end_card(d, p):
    k = ease(p * 3)
    logo_mark(d, GCX - 75, 640, 2.5, lerp(BG, ACC, k))
    draw_center(d, 840, "PEPTID CENTAR", font(FONT_XB, 80), lerp(BG, TXT, k))
    draw_center(d, 950, "Peptidi bez hajpa", font(FONT_XB, 54), lerp(BG, ACC, k))
    draw_center(d, 1180, "Edukacija · nije medicinski savjet", font(FONT_IN, 40), lerp(BG, MUTED, k))

# ---------------------------------------------------------------- main
def main():
    timing = json.load(open(sys.argv[1]))
    voice = sys.argv[2]
    out = sys.argv[3]
    total = timing[-1]["end"] + 0.4 + END_CARD
    speech_end = timing[-1]["end"] + 0.4
    subs = build_subs(timing)
    # graphic windows: each sentence's graphic holds until the next starts
    wins = []
    for i, seg in enumerate(timing):
        s = 0.0 if i == 0 else seg["start"] - 0.15
        e = timing[i + 1]["start"] - 0.15 if i + 1 < len(timing) else speech_end
        wins.append((s, e, SCRIPT[i][2]))
    # graphics that share a beat keep one window
    nframes = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
                           os.path.join(out, "video_only.mp4")], stdin=subprocess.PIPE)
    for fi in range(nframes):
        t = fi / FPS
        img = Image.new("RGB", (W, H), BG)
        d = ImageDraw.Draw(img)
        if t < speech_end:
            for s, e, g in wins:
                if s <= t < e:
                    p = (t - s) / max(0.01, (e - s))
                    # wipe-in transition from right for first 0.2 s
                    gl = Image.new("RGB", (W, 1100), BG)
                    G[g](ImageDraw.Draw(gl), min(1.0, (t - s) / min(1.6, e - s)), t)
                    img.paste(gl.crop((0, 200, W, 1100)), (0, 300 + int(round(7 * math.sin(t * 1.3)))))
                    break
            for sb in subs:
                if sb["start"] <= t < sb["end"]:
                    draw_sub(d, sb, t)
                    break
            if t >= 3.0:
                draw_logo(img, 0.7 * ease((t - 3.0) / 0.4))
            # persistent tiny disclaimer above the subtitle band
            pass
        else:
            end_card(d, (t - speech_end) / END_CARD)
        ff.stdin.write(img.tobytes())
    ff.stdin.close(); ff.wait()
    # SRT
    def ts(x):
        h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
        return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
    with open(os.path.join(out, "titlovi.srt"), "w", encoding="utf-8") as f:
        for i, sb in enumerate(subs, 1):
            f.write(f"{i}\n{ts(sb['start'])} --> {ts(sb['end'])}\n{' '.join(sb['words'])}\n\n")
    json.dump({"total": total, "subs": subs}, open(os.path.join(out, "render_meta.json"), "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()

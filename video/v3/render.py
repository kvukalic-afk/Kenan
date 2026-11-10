#!/usr/bin/env python3
"""Peptid Centar · V3 (UGC) renderer: photo shots with handheld Ken Burns, TikTok-style captions, light overlays.
Usage: python3 render.py   (reads build/voice_el.mp3, shots/S1..S7.(png|jpg|webp); writes build/video_only.mp4 etc.)
Missing shots render as neutral placeholders so the timing can be checked before images exist.
"""
import glob, json, math, os, re, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, "build"); SH = os.path.join(HERE, "shots")
W, H, FPS = 1080, 1920, 30
FXB = os.path.join(HERE, "..", "fonts", "Manrope-ExtraBold.ttf")
FIN = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
BG = (0x1F, 0x22, 0x26); TXT = (0xF5, 0xF0, 0xE8); ACC = (0xB8, 0x73, 0x33); INK = (0x14, 0x15, 0x17)
SAFE_L, SAFE_R = 70, 140
GCX = (SAFE_L + W - SAFE_R) // 2
END_CARD = 1.8

# Spoken segments in order (split at the voice's pauses). Display text uses digits and names.
SEGMENTS = [
    "Znaš li da tvoje tijelo samo pravi peptid koji se danas stavlja u kreme protiv bora?",
    "Zove se bakreni peptid.",
    "I evo zašto je zanimljiv.",
    "U laboratoriji je natjerao ćelije kože da prave više kolagena i elastina,",
    "to su vlakna koja koži daju čvrstoću i elastičnost.",
    "Onda su ga probali na licu.",
    "40 žena, 8 sedmica.",
    "Pola lica serum s bakrenim peptidom, druga polovina isti serum,",
    "ali bez njega.",
    "Rezultat? Na strani s peptidom, volumen bora pao je za oko 56%!",
    "I bio je bolji čak i od kreme s Matrixylom, jednim od najpoznatijih peptida za kožu.",
    "Sačuvaj ovo, da ti bude pri ruci.",
    "I prati Peptid Centar, peptidi bez hajpa.",
]
ACCENT = {"peptid", "bakreni", "kolagena", "elastina", "40", "8", "56%!", "bolji", "Sačuvaj", "Centar,", "pola", "Pola", "bez"}
# shot per segment index range, and overlay card
SHOTS = [  # (first_segment, shot_file, overlay)
    (0, "S1", "hook"),
    (1, "S2", "name"),
    (3, "S3", "collagen"),
    (5, "S4", "study"),
    (7, "S4b", "split"),
    (9, "S5", "result"),
    (10, "S6", "matrixyl"),
    (11, "S7", "save"),
]

_fc = {}
def F(p, s):
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def back(t, s=1.6):
    t = max(0.0, min(1.0, t)); t -= 1; return 1 + t * t * ((s + 1) * t + s)

def segments_from_silence(path, n):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "silencedetect=noise=-35dB:d=0.3", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout)
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
    sil = [(a, b) for a, b in zip(st, en) if a > 0.05 and b < dur - 0.05]
    sil = sorted(sorted(sil, key=lambda s: s[1] - s[0], reverse=True)[: n - 1])
    assert len(sil) == n - 1, f"pauses {len(sil)} != {n-1}"
    segs, cur = [], 0.0
    for a, b in sil: segs.append((cur, a)); cur = b
    segs.append((cur, dur))
    return segs, dur

def load_words():
    """Word timings from ElevenLabs Scribe if present (build/words.json), else proportional within segments."""
    p = os.path.join(B, "words.json")
    return json.load(open(p)) if os.path.exists(p) else None

def build_subs(segs):
    subs = []
    words_t = load_words()
    for si, (text, (s0, s1)) in enumerate(zip(SEGMENTS, segs)):
        words = text.split()
        lens = [len(w) + 1 for w in words]; tot = sum(lens)
        starts, acc = [], 0
        for L in lens: starts.append(s0 + (s1 - s0) * acc / tot); acc += L
        if words_t:  # snap to nearest transcribed word start inside the segment
            cand = [w["start"] for w in words_t if s0 - 0.1 <= w["start"] <= s1]
            if len(cand) == len(words): starts = cand
        chunks, cur = [], []
        for i, w in enumerate(words):
            if cur and (len(" ".join(words[j] for j in cur + [i])) > 16 or len(cur) >= 3):
                chunks.append(cur); cur = []
            cur.append(i)
            if w[-1] in ".,?!:" : chunks.append(cur); cur = []
        if cur: chunks.append(cur)
        for ci, c in enumerate(chunks):
            st = starts[c[0]]
            en = starts[chunks[ci + 1][0]] if ci + 1 < len(chunks) else s1 + 0.15
            subs.append({"start": st - 0.04, "end": en, "words": [words[j] for j in c]})
    return subs

def load_shot(name):
    for ext in ("png", "jpg", "jpeg", "webp"):
        p = os.path.join(SH, f"{name}.{ext}")
        if os.path.exists(p):
            im = Image.open(p).convert("RGB")
            break
    else:
        if name == "S4b":
            return load_shot("S4").transpose(Image.FLIP_LEFT_RIGHT) if any(os.path.exists(os.path.join(SH, f"S4.{e}")) for e in ("png", "jpg", "jpeg", "webp")) else placeholder(name)
        return placeholder(name)
    # cover-fit to 1.18x frame for Ken Burns headroom
    tw_, th_ = int(W * 1.18), int(H * 1.18)
    sc = max(tw_ / im.width, th_ / im.height)
    im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
    x0 = (im.width - tw_) // 2; y0 = (im.height - th_) // 2
    return im.crop((x0, y0, x0 + tw_, y0 + th_))

def placeholder(name):
    im = Image.new("RGB", (int(W * 1.18), int(H * 1.18)), (70, 66, 62))
    d = ImageDraw.Draw(im)
    d.text((200, 900), f"[{name}]", font=F(FXB, 120), fill=(140, 132, 124))
    return im

def kenburns(img, p, t, mode):
    # zoom in/out + slow pan + tiny handheld jitter
    z0, z1 = (1.03, 1.13) if mode % 2 == 0 else (1.13, 1.04)
    z = z0 + (z1 - z0) * (0.5 - 0.5 * math.cos(math.pi * p))
    vw, vh = img.width / z, img.height / z  # canvas is 1.18x frame; z=1 shows it all
    pan = (p - 0.5) * (1 if mode % 3 else -1)
    cx = img.width / 2 + pan * (img.width - vw) * 0.6 + 3.0 * math.sin(t * 2.1) + 2.0 * math.sin(t * 5.3)
    cy = img.height / 2 + 2.5 * math.cos(t * 1.7) + 1.5 * math.sin(t * 4.1)
    x0 = max(0, min(img.width - vw, cx - vw / 2)); y0 = max(0, min(img.height - vh, cy - vh / 2))
    return img.transform((W, H), Image.EXTENT, (x0, y0, x0 + vw, y0 + vh), Image.BILINEAR)

# ---------------------------------------------------------------- overlays (UGC: bold text, simple chips)
def stroke_text(d, xy, s, f, fill, sw=7, anchor="la"):
    d.text(xy, s, font=f, fill=fill, stroke_width=sw, stroke_fill=INK, anchor=anchor)

def card(d, y, lines, k):
    """lines: [(text, font, color)] centred, on a translucent dark pill."""
    if k <= 0: return
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    hs = [l[1].size * 1.18 for l in lines]
    wmax = max(od.textlength(l[0], font=l[1]) for l in lines)
    pad = 44
    h = sum(hs) + pad * 1.4
    yy = y + (1 - k) * 40
    od.rounded_rectangle((GCX - wmax / 2 - pad, yy, GCX + wmax / 2 + pad, yy + h), radius=36, fill=INK + (int(190 * k),))
    cy = yy + pad * 0.7
    for (s, f, c), hh in zip(lines, hs):
        od.text((GCX, cy), s, font=f, fill=c + (int(255 * k),), anchor="ma")
        cy += hh
    d._image.paste(Image.alpha_composite(d._image.convert("RGBA"), ov).convert("RGB"))

def ov_hook(d, tb, T):
    k = back(tb / 0.35) if tb > 0 else 1
    card(d, 300, [("TVOJE TIJELO", F(FXB, 84), TXT), ("GA VEĆ PRAVI", F(FXB, 84), ACC), ("peptid iz krema protiv bora", F(FIN, 40), TXT)], min(1, k) if tb > 0.01 else 1)
def ov_name(d, tb, T):
    card(d, 330, [("BAKRENI PEPTID", F(FXB, 80), ACC), ("GHK-Cu", F(FIN, 44), TXT)], ease(tb / 0.3))
def ov_collagen(d, tb, T):
    card(d, 300, [("u laboratoriji", F(FIN, 40), TXT), ("+ KOLAGEN", F(FXB, 84), ACC), ("+ ELASTIN", F(FXB, 84), ACC)], ease((tb - 0.6) / 0.35))
    if tb > T * 0.5:
        card(d, 690, [("= čvrstoća i elastičnost", F(FXB, 50), TXT)], ease((tb - T * 0.5) / 0.35))
def ov_study(d, tb, T):
    card(d, 300, [("40 žena", F(FXB, 92), ACC), ("8 sedmica", F(FXB, 92), TXT)], ease((tb - 1.3) / 0.35))
def ov_split(d, tb, T):
    k = ease(tb / 0.35)
    if k <= 0: return
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    od.line((W // 2, 260, W // 2, 260 + 760 * k), fill=TXT + (230,), width=6)
    d._image.paste(Image.alpha_composite(d._image.convert("RGBA"), ov).convert("RGB"))
    stroke_text(d, (W // 2 - 30, 300), "S PEPTIDOM", F(FXB, 54), ACC, anchor="ra")
    stroke_text(d, (W // 2 + 30, 300), "BEZ", F(FXB, 54), TXT)
def ov_result(d, tb, T):
    p = ease((tb - 0.9) / 1.0)
    s = "−" + str(int(round(56 * p))) + "%"
    k = back((tb - 0.9) / 0.3)
    if tb > 0.9:
        card(d, 300, [(s, F(FXB, 190), ACC), ("volumen bora", F(FXB, 56), TXT)], min(1, k))
def ov_matrixyl(d, tb, T):
    card(d, 300, [("BOLJI ČAK I OD", F(FXB, 70), TXT), ("MATRIXYLA", F(FXB, 96), ACC), ("poznatog peptida za kožu", F(FIN, 40), TXT)], ease((tb - 0.4) / 0.35))
def ov_save(d, tb, T):
    k = back(tb / 0.4)
    card(d, 300, [("SAČUVAJ", F(FXB, 100), ACC), ("+ prati Peptid Centar", F(FXB, 50), TXT)], min(1, k))
OV = {"hook": ov_hook, "name": ov_name, "collagen": ov_collagen, "study": ov_study, "split": ov_split,
      "result": ov_result, "matrixyl": ov_matrixyl, "save": ov_save}

def draw_caption(d, sb, t):
    f = F(FXB, 88)
    line = " ".join(sb["words"])
    k = back((t - sb["start"]) / 0.14, 1.4)
    sc = 0.9 + 0.1 * min(1, k)
    fs = F(FXB, int(88 * sc))
    w = d.textlength(line, font=fs)
    x = GCX - w / 2; y = 1300
    for wd in sb["words"]:
        col = ACC if wd.strip(".,?!:") in {a.strip(".,?!:") for a in ACCENT} else TXT
        stroke_text(d, (x, y), wd, fs, col, sw=8)
        x += d.textlength(wd + " ", font=fs)

def logo(img, a):
    ov = Image.new("RGBA", (440, 90), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    r = 30; od.ellipse((0, 10, 2 * r, 10 + 2 * r), outline=ACC + (255,), width=5)
    for i in range(3):
        cx = r - 14 + i * 14; od.ellipse((cx - 4.5, 10 + r - 4.5, cx + 4.5, 10 + r + 4.5), fill=ACC + (255,))
    od.text((78, 20), "PEPTID CENTAR", font=F(FXB, 34), fill=TXT + (255,), stroke_width=3, stroke_fill=INK + (255,))
    ov.putalpha(ov.split()[3].point(lambda v: int(v * a)))
    img.paste(ov, (SAFE_L, 232), ov)

def end_card(d, p):
    k = ease(p * 3)
    c = lambda col: tuple(int(BG[i] + (col[i] - BG[i]) * k) for i in range(3))
    d.ellipse((GCX - 75, 600, GCX + 75, 750), outline=c(ACC), width=12)
    for i in range(3):
        cx = GCX - 35 + i * 35; d.ellipse((cx - 11, 664, cx + 11, 686), fill=c(ACC))
    d.text((GCX, 800), "PEPTID CENTAR", font=F(FXB, 84), fill=c(TXT), anchor="ma")
    d.text((GCX, 915), "Peptidi bez hajpa", font=F(FXB, 56), fill=c(ACC), anchor="ma")
    d.text((GCX, 1180), "Edukacija · nije medicinski savjet", font=F(FIN, 40), fill=c((0x8C, 0x8F, 0x94)), anchor="ma")

def main():
    voice = os.path.join(B, "voice_el.mp3")
    segs, dur = segments_from_silence(voice, len(SEGMENTS))
    speech_end = dur + 0.2
    total = speech_end + END_CARD
    subs = build_subs(segs)
    shots = []
    for i, (si, name, ov) in enumerate(SHOTS):
        st = 0.0 if i == 0 else segs[si][0] - 0.15
        shots.append([st, name, ov])
    for i in range(len(shots)):
        shots[i].append(shots[i + 1][0] if i + 1 < len(shots) else speech_end)
    imgs = {name: load_shot(name) for _, name, _, _ in shots}
    sfx = [(s, "whoosh") for s, _, _, _ in shots[1:]] + [(speech_end, "whoosh")]
    sfx += [(segs[9][0] + 0.9, "ding"), (shots[3][0] + 1.3, "pop"), (segs[3][0] + 0.6, "pop")]
    ff = subprocess.Popen(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
                           os.path.join(B, "video_only.mp4")], stdin=subprocess.PIPE)
    n = int(round(total * FPS))
    for fi in range(n):
        t = fi / FPS
        if t < speech_end:
            for j, (s, name, ov, e) in enumerate(shots):
                if s <= t < e:
                    p = (t - s) / (e - s)
                    frame = kenburns(imgs[name], p, t, j)
                    # quick flash-cut: 3 frames brighten on cut (UGC jump cut feel)
                    if j and t - s < 2 / FPS:
                        frame = Image.blend(frame, Image.new("RGB", (W, H), (255, 255, 255)), 0.25)
                    d = ImageDraw.Draw(frame)
                    OV[ov](d, t - s, e - s)
                    break
            for sb in subs:
                if sb["start"] <= t < sb["end"]:
                    draw_caption(d, sb, t); break
            if t >= shots[1][0]: logo(frame, 0.75 * ease((t - shots[1][0]) / 0.4))
        else:
            frame = Image.new("RGB", (W, H), BG); end_card(ImageDraw.Draw(frame), (t - speech_end) / END_CARD)
        ff.stdin.write(frame.tobytes())
    ff.stdin.close(); ff.wait()
    def ts(x):
        ms = int(round((x % 1) * 1000)) % 1000
        return f"{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{ms:03d}"
    with open(os.path.join(B, "titlovi.srt"), "w", encoding="utf-8") as f:
        for i, sb in enumerate(subs, 1):
            f.write(f"{i}\n{ts(max(0, sb['start']))} --> {ts(sb['end'])}\n{' '.join(sb['words'])}\n\n")
    json.dump({"total": total, "speech_end": speech_end, "sfx": sfx, "segments": segs}, open(os.path.join(B, "render_meta.json"), "w"), indent=1)
    print("frames", n, "subs", len(subs), "segments", [(round(a, 2), round(b, 2)) for a, b in segs])

if __name__ == "__main__":
    main()

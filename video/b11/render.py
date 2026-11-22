#!/usr/bin/env python3
"""Peptid Centar B11 · „Porodična grupa tvog tijela“: animirani grupni chat (ekran = telefon), karaoke titlovi, SFX, HELVERA potpis.
Reads build/timing.json -> build/video_only.mp4, build/titlovi.srt, build/render_meta.json"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from script import SCRIPT
B = os.path.join(HERE, "build")
W, H, FPS = 1080, 1920, 30
FXB = os.path.join(HERE, "..", "fonts", "Manrope-ExtraBold.ttf")
IT = "/usr/share/fonts/opentype/inter/Inter-"
EMO = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
HV = os.path.join(HERE, "..", "brand", "helvera")
NAVY = (0x0B, 0x1F, 0x3A); INK = (0x04, 0x0C, 0x18); TEAL = (0x19, 0xE0, 0xD8); YEL = (0xFF, 0xD2, 0x3F); RED = (0xFF, 0x5A, 0x5A)
TXT = (255, 255, 255); WALL = (0xEC, 0xE5, 0xDA); WALL2 = (0xE2, 0xDA, 0xCC); BUB = (255, 255, 255); GREYT = (0x6B, 0x74, 0x80)
HV_WHITE = (0xF6, 0xF6, 0xF3); HV_NAVY = (0x14, 0x23, 0x3C); HV_GREY = (0x8E, 0x99, 0xA4); HV_TEXT = (0x4B, 0x58, 0x69)
END = 3.0; CX = W // 2
SFX = []
M = {  # members: name, colour, initials, aminokiseline
    "grelin": ("Grelin", (0xF2, 0x8C, 0x28), "Gr", 28),
    "inzulin": ("Inzulin", (0x3B, 0x82, 0xF6), "In", 51),
    "oksi": ("Oksitocin", (0xEC, 0x48, 0x99), "Ok", 9),
    "glp": ("GLP-1", (0x16, 0xA3, 0x4A), "G1", 30),
    "nana": ("Nana", (0x7C, 0x3A, 0xED), "N", None),
    "sema": ("Semaglutid", (0x0E, 0x94, 0x88), "Se", None),
}
_f = {}
def F(p, s):
    k = (p, int(s))
    if k not in _f: _f[k] = ImageFont.truetype(p if p.endswith(("ttf", "otf")) else IT + p + ".otf", max(4, int(s)))
    return _f[k]
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def back(t, s=2.2):
    t = max(0.0, min(1.0, t)); t -= 1; return 1 + t * t * ((s + 1) * t + s)
_em = {}
def emoji(ch, size):
    k = (ch, size)
    if k not in _em:
        f = ImageFont.truetype(EMO, 109); im = Image.new("RGBA", (136, 128), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((0, 0), ch, font=f, embedded_color=True)
        bb = im.getbbox() or (0, 0, 1, 1); im = im.crop(bb)
        _em[k] = im.resize((max(1, int(im.width * size / 109)), max(1, int(im.height * size / 109))), Image.LANCZOS)
    return _em[k]
def paste_emoji(img, ch, x, y, size):
    e = emoji(ch, size); img.paste(e, (int(x), int(y)), e); return e.width

# ---------------------------------------------------------------- timeline
def build_events(timing):
    seg = {s["scene"]: (t["start"], t["end"]) for s, t in zip(SCRIPT, timing)}
    def at(sc, fr): a, b = seg[sc]; return a + fr * (b - a)
    msgs = [
        dict(who="grelin", text="Ima li šta za jesti?", emo="👀", t=at("grelin", 0.45)),
        dict(who="inzulin", text="Šećer stigao, sve u ostavu!", emo="📦", t=at("inzulin", 0.35)),
        dict(who="oksi", text="", emo="❤️❤️❤️", t=at("oksi", 0.25)),
        dict(who="glp", text="Dosta je. Sit si.", emo="✋", t=at("glp", 0.5), deleted=at("deleted", 0.72)),
        dict(who="nana", text="JEDI, JEDI, KOSTI SU TI!", emo="🍲", t=at("nana", 0.28), big=True),
        dict(who="sema", text="Dosta je. Sit si.", emo="✋", t=at("sema", 0.62), pin=True),
        dict(who="nana", text="jedi, jedi", emo="😂", t=at("cta", 0.78)),
    ]
    return seg, msgs

def bubble_layout(d, m):
    f = F("SemiBold", 70 if m.get("big") else 54)
    text = m["text"]; emo = m["emo"]
    tw = d.textlength(text, font=f) if text else 0
    ew = sum(emoji(c, 62).width + 6 for c in emo if not c in "️") if emo else 0
    w = min(820, max(260, tw + (14 if text and emo else 0) + ew + 70)); h = 160 if m.get("big") else 140
    return f, w, h

def draw_msg(img, d, m, y, t):
    nm, col, ini, _ = M[m["who"]]
    k = back((t - m["t"]) / 0.28, 2.6)
    if k <= 0: return
    del_k = ease((t - m["deleted"]) / 0.25) if m.get("deleted") else 0
    f, w, h = bubble_layout(d, m)
    if del_k > 0: w = max(w, 560)
    x0 = 150; sc = min(1.04, k)
    shake = 0
    if m.get("big"):
        dt = t - m["t"]; shake = 12 * max(0, 1 - dt / 0.8) * math.sin(dt * 70)
    x0 += shake
    # avatar
    ax, ay = 82, y + h - 42
    d.ellipse((ax - 42, ay - 42, ax + 42, ay + 42), fill=col)
    if m["who"] == "nana": paste_emoji(img, "👵", ax - 30, ay - 31, 60)
    else: d.text((ax, ay), ini, font=F(FXB, 34), fill=TXT, anchor="mm")
    # bubble (scale from bottom-left)
    bw, bh = w * sc, h * sc
    by0 = y + h - bh
    d.rounded_rectangle((x0, by0, x0 + bw, by0 + bh), radius=34, fill=(0xF4, 0xF4, 0xF4) if del_k > 0.5 else BUB)
    d.polygon([(x0 + 4, y + h - 30), (x0 - 18, y + h), (x0 + 30, y + h - 4)], fill=(0xF4, 0xF4, 0xF4) if del_k > 0.5 else BUB)
    if sc < 0.9: return
    d.text((x0 + 30, by0 + 16), nm, font=F(FXB, 32), fill=col)
    if m.get("pin"):
        pw = d.textlength("traje ~7 dana", font=F("SemiBold", 28))
        d.rounded_rectangle((x0 + bw - pw - 92, by0 + 14, x0 + bw - 22, by0 + 56), radius=20, fill=(0xD1, 0xFA, 0xE5))
        paste_emoji(img, "📌", x0 + bw - pw - 84, by0 + 18, 30)
        d.text((x0 + bw - 32, by0 + 35), "traje ~7 dana", font=F("SemiBold", 28), fill=(0x06, 0x5F, 0x46), anchor="rm")
    ty = by0 + (68 if not m.get("big") else 64)
    if del_k > 0.5:
        paste_emoji(img, "🚫", x0 + 30, ty + 2, 40)
        d.text((x0 + 84, ty), "Ova poruka je obrisana", font=F("Italic", 44), fill=GREYT)
        return
    x = x0 + 30
    if m["text"]:
        d.text((x, ty), m["text"], font=f, fill=(0x11, 0x18, 0x27)); x += d.textlength(m["text"], font=f) + 14
    for c in m["emo"]:
        if c == "️": continue
        x += paste_emoji(img, c, x, ty - 2, 62 if not m.get("big") else 70) + 6
    if del_k > 0: d.rectangle((x0, by0, x0 + bw, by0 + bh), outline=RED, width=int(6 * (1 - del_k)) + 1)

def typing(d, who, y, t):
    nm, col, ini, _ = M[who]
    d.ellipse((40, y + 60, 124, y + 144), fill=col)
    d.text((82, y + 102), ini if who != "nana" else "N", font=F(FXB, 34), fill=TXT, anchor="mm")
    d.rounded_rectangle((150, y + 40, 330, y + 140), radius=34, fill=BUB)
    for i in range(3):
        a = 0.5 + 0.5 * math.sin(t * 10 - i * 0.9)
        d.ellipse((190 + i * 44 - 12, y + 90 - 12 - 8 * a, 190 + i * 44 + 12, y + 90 + 12 - 8 * a), fill=(int(150 + 60 * a),) * 3)

_wall = {}
def wallpaper():
    if "w" not in _wall:
        im = Image.new("RGB", (W, H), WALL); d = ImageDraw.Draw(im)
        for r in range(0, H, 150):
            for c in range(0, W, 150):
                x, y = c + (75 if (r // 150) % 2 else 0), r
                d.ellipse((x - 10, y - 10, x + 10, y + 10), outline=WALL2, width=3)
                d.line((x + 10, y, x + 40, y + 18), fill=WALL2, width=3)
                d.ellipse((x + 40, y + 8, x + 60, y + 28), outline=WALL2, width=3)
        _wall["w"] = im
    return _wall["w"]

def header(img, d, t, muted_k):
    d.rectangle((0, 0, W, 250), fill=NAVY)
    d.ellipse((40, 120, 130, 210), fill=(0x1E, 0x3A, 0x5F)); paste_emoji(img, "🫀", 56, 136, 58)
    d.text((152, 122), "Porodica (tvoje tijelo)", font=F(FXB, 44), fill=TXT)
    d.text((152, 178), "Grelin, Inzulin, Oksitocin, GLP-1, Nana", font=F("Regular", 30), fill=(0xA8, 0xB8, 0xCC))
    if muted_k > 0:
        a = back(muted_k / 1.0, 3) if muted_k < 1 else 1
        x = W - 120; y = 165
        d.ellipse((x - 46 * a, y - 46 * a, x + 46 * a, y + 46 * a), fill=RED)
        if a > 0.8: paste_emoji(img, "🔇", x - 26, y - 26, 52)

# ---------------------------------------------------------------- overlays per scene (drawn above the chat)
def ov_hook(img, d, tb, T):
    a = back(tb / 0.35, 3)
    if a <= 0: return
    if tb < 0.02: SFX.append((None, "boom"))
    d.rounded_rectangle((CX - 420, 470, CX + 420, 640), radius=40, fill=INK)
    d.text((CX, 555), "TVOJE TIJELO IMA", font=F(FXB, 62 * min(1.06, a)), fill=TXT, anchor="mm")
    d.text((CX, 720), "PORODIČNU GRUPU", font=F(FXB, 96 * min(1.06, a)), fill=YEL, anchor="mm", stroke_width=10, stroke_fill=INK)
    b = back((tb - T * 0.55) / 0.3, 3)
    if b > 0:
        if abs(tb - T * 0.55) < 0.5 / FPS: SFX.append((None, "pop"))
        d.rounded_rectangle((CX - 400, 840, CX + 400, 960), radius=36, fill=RED)
        d.text((CX, 900), "+ 1 član kojeg NIKO ne sluša", font=F(FXB, 46 * min(1.05, b)), fill=TXT, anchor="mm")

def ov_deleted(img, d, tb, T):
    a = ease((tb - T * 0.18) / 0.3)
    if a <= 0: return
    p = min(1, max(0, (tb - T * 0.25) / (T * 0.45)))
    secs = int(round(120 * (1 - p)))
    cx, cy = CX, 560
    d.ellipse((cx - 150, cy - 150, cx + 150, cy + 150), fill=INK)
    d.arc((cx - 130, cy - 130, cx + 130, cy + 130), -90, -90 + 360 * (1 - p), fill=RED, width=18)
    d.text((cx, cy - 10), f"{secs // 60}:{secs % 60:02d}", font=F(FXB, 92), fill=TXT, anchor="mm")
    d.text((cx, cy + 70), "GLP-1 · poluživot", font=F("SemiBold", 28), fill=(0xA8, 0xB8, 0xCC), anchor="mm")
    if int(tb * 4) != int((tb - 1 / FPS) * 4) and p < 1: SFX.append((None, "tick"))

def ov_all(img, d, tb, T):
    a = ease(tb / 0.35)
    ov = Image.new("RGBA", (W, H), (4, 12, 24, int(238 * a))); img.paste(ov, (0, 0), ov)
    d = ImageDraw.Draw(img)
    d.text((CX, 330), "SVI SU", font=F(FXB, 70), fill=(255, 255, 255), anchor="mm")
    k = back((tb - 0.2) / 0.35, 3)
    if k > 0: d.text((CX, 440), "PEPTIDI", font=F(FXB, 150 * min(1.05, k)), fill=YEL, anchor="mm", stroke_width=10, stroke_fill=INK)
    for i, key in enumerate(["grelin", "inzulin", "oksi", "glp"]):
        nm, col, ini, n = M[key]; t0 = 0.5 + i * T * 0.12
        e = ease((tb - t0) / 0.4)
        if e <= 0: continue
        if abs(tb - t0) < 0.5 / FPS: SFX.append((None, "pop"))
        y = 620 + i * 190
        d.ellipse((90, y, 174, y + 84), fill=col); d.text((132, y + 42), ini, font=F(FXB, 32), fill=TXT, anchor="mm")
        d.text((200, y + 4), nm, font=F(FXB, 54), fill=TXT)
        d.text((W - 90, y + 14), f"{n} aminokiselina", font=F("SemiBold", 34), fill=(0xA8, 0xB8, 0xCC), anchor="ra")
        nb = int(min(n, 26) * e)
        for j in range(nb):
            x = 210 + j * 30; yy = y + 112 + 6 * math.sin(j * 0.8 + tb * 3)
            d.ellipse((x - 10, yy - 10, x + 10, yy + 10), fill=col)

def ov_cta(img, d, tb, T):
    a = back(tb / 0.35, 3)
    if a <= 0: return
    if tb < 0.02: SFX.append((None, "whoosh"))
    y0 = 300
    d.rounded_rectangle((90, y0, W - 90, y0 + 330), radius=40, fill=INK)
    d.text((CX, y0 + 60), "Proslijedi u:", font=F("SemiBold", 40), fill=(0xA8, 0xB8, 0xCC), anchor="mm")
    rows = [("👨‍👩‍👧", "Porodica"), ("👵", "Nana"), ("🏋️", "Ekipa iz teretane")]
    for i, (e, nm) in enumerate(rows):
        y = y0 + 120 + i * 70; paste_emoji(img, e[0], 150, y - 24, 46)
        d.text((220, y), nm, font=F(FXB, 44), fill=TXT, anchor="lm")
        ck = ease((tb - 0.5 - i * 0.25) / 0.25)
        if ck > 0:
            if abs(tb - (0.5 + i * 0.25)) < 0.5 / FPS: SFX.append((None, "tick"))
            d.ellipse((W - 190, y - 24, W - 142, y + 24), fill=TEAL)
            d.line((W - 178, y, W - 168, y + 12, W - 152, y - 12), fill=INK, width=7)

OV = {"hook": ov_hook, "deleted": ov_deleted, "all": ov_all, "cta": ov_cta}

# ---------------------------------------------------------------- captions (karaoke, jednostavno po rečenici)
def build_subs(timing):
    subs = []
    for s, seg in zip(SCRIPT, timing):
        words = s["sub"].split(); chunks, cur = [], []
        for w in words:
            cur.append(w)
            if len(" ".join(cur)) > 16 or w[-1] in ".,?:!“": chunks.append(cur); cur = []
        if cur: chunks.append(cur)
        tot = sum(len(" ".join(c)) + 4 for c in chunks); t = seg["start"]
        for c in chunks:
            dur = (seg["end"] - seg["start"]) * (len(" ".join(c)) + 4) / tot
            subs.append({"start": t, "end": t + dur, "words": c, "acc": s["acc"]}); t += dur
    return subs

def draw_caption(img, d, sb, t):
    k = back((t - sb["start"]) / 0.12, 2.5)
    f = F(FXB, 78 * (0.9 + 0.1 * min(1.05, k)))
    w = d.textlength(" ".join(sb["words"]), font=f); x = CX - w / 2; y = 1560
    n = len(sb["words"]); cur = min(n - 1, int((t - sb["start"]) / max(0.01, (sb["end"] - sb["start"])) * n))
    for i, wd in enumerate(sb["words"]):
        ww = d.textlength(wd, font=f)
        if i == cur:
            d.rounded_rectangle((x - 12, y - 4, x + ww + 12, y + f.size * 1.25), radius=16, fill=TEAL); d.text((x, y), wd, font=f, fill=INK)
        else:
            d.text((x, y), wd, font=f, fill=YEL if wd in sb["acc"] else TXT, stroke_width=8, stroke_fill=INK)
        x += d.textlength(wd + " ", font=f)

_lg = {}
def end_card(img, p):
    d = ImageDraw.Draw(img); k = ease(p * 2.2)
    mixw = lambda c: tuple(int(HV_WHITE[i] + (c[i] - HV_WHITE[i]) * k) for i in range(3))
    f = F("SemiBold", 34); s = "PEPTID CENTAR"; sp = 9
    w = sum(d.textlength(ch, font=f) + sp for ch in s) - sp; x = CX - w / 2
    for ch in s: d.text((x, 690), ch, font=f, fill=mixw(HV_NAVY)); x += d.textlength(ch, font=f) + sp
    lw = int(150 * k); d.line((CX - lw, 770, CX + lw, 770), fill=mixw(HV_GREY), width=2)
    d.text((CX, 808), "edukativni projekat brenda", font=F("Regular", 40), fill=mixw(HV_TEXT), anchor="ma")
    if "lg" not in _lg:
        lg = Image.open(os.path.join(HV, "helvera_logo.png")).convert("RGBA"); _lg["lg"] = lg.resize((640, int(lg.height * 640 / lg.width)), Image.LANCZOS)
    lg = _lg["lg"].copy(); a2 = ease((p - 0.18) * 2.4); lg.putalpha(lg.split()[3].point(lambda v: int(v * a2))); img.paste(lg, (CX - 320, 930), lg)
    d.text((CX, 1330), "Edukacija · nije medicinski savjet", font=F("Regular", 30), fill=mixw(HV_GREY), anchor="ma")

def main():
    timing = json.load(open(os.path.join(B, "timing.json")))
    seg, msgs = build_events(timing)
    speech_end = timing[-1]["end"] + 0.5; total = speech_end + END
    subs = build_subs(timing)
    starts = [(s["scene"], t["start"] if i else 0.0, t["end"]) for i, (s, t) in enumerate(zip(SCRIPT, timing))]
    for m in msgs: SFX.append((m["t"], "boom" if m.get("big") else ("ding" if m.get("pin") else "pop")))
    for m in msgs:
        if m.get("deleted"): SFX.append((m["deleted"], "whoosh"))
    for sc, a, b in starts[1:]: SFX.append((a, "whoosh")) if sc in OV else None
    ff = subprocess.Popen(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", os.path.join(B, "video_only.mp4")], stdin=subprocess.PIPE)
    n = int(round(total * FPS)); ST = 0.0; scroll = 0.0; last = None
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    for fi in range(n):
        t = fi / FPS
        if t >= speech_end:
            frame = Image.new("RGB", (W, H), HV_WHITE); end_card(frame, (t - speech_end) / END)
            if t - speech_end < 0.35: frame = Image.blend(last, frame, ease((t - speech_end) / 0.35))
            ff.stdin.write(frame.tobytes()); continue
        frame = wallpaper().copy(); d = ImageDraw.Draw(frame)
        scene = next((sc for sc, a, b in reversed(starts) if t >= a), "hook")
        # chat stack: visible messages from bottom (y=1400) upward
        vis = [m for m in msgs if t >= m["t"] - 0.0]
        nxt = next((m for m in msgs if m["t"] > t), None)
        show_typing = nxt is not None and 0 < nxt["t"] - t < 0.9 and scene not in ("all",)
        heights = [bubble_layout(probe, m)[2] + 34 for m in vis]
        target = sum(heights) + (180 if show_typing else 0)
        scroll += (target - scroll) * 0.25
        y = 1400 - scroll
        for m, h in zip(vis, heights):
            if y + h > 230: draw_msg(frame, d, m, y, t)
            y += h
        if show_typing: typing(d, nxt["who"], y - 20, t)
        header(frame, d, t, (t - seg["hook"][0] - (seg["hook"][1] - seg["hook"][0]) * 0.6))
        sc_a = next(a for sc, a, b in starts if sc == scene); sc_b = next(b for sc, a, b in starts if sc == scene)
        if scene in OV:
            n0 = len(SFX); OV[scene](frame, d, t - sc_a, sc_b - sc_a)
            for q in range(n0, len(SFX)):
                if SFX[q][0] is None: SFX[q] = (t, SFX[q][1])
            d = ImageDraw.Draw(frame)
        # bottom band + captions
        band = Image.new("RGBA", (W, 520), (4, 12, 24, 0)); bd = ImageDraw.Draw(band)
        for i in range(520): bd.line((0, i, W, i), fill=(4, 12, 24, int(225 * min(1, i / 160))))
        frame.paste(band, (0, H - 520), band); d = ImageDraw.Draw(frame)
        for sb in subs:
            if sb["start"] <= t < sb["end"]: draw_caption(frame, d, sb, t); break
        d.text((CX, 1850), "@peptidcentar", font=F("SemiBold", 30), fill=(0x9A, 0xA8, 0xBA), anchor="mm")
        # camera: punch-in on new message, shake on nana
        z = 1.0
        for m in msgs:
            dt = t - m["t"]
            if 0 <= dt < 0.5: z = max(z, 1.0 + (0.07 if m.get("big") else 0.035) * (1 - ease(dt / 0.5)))
        if z > 1.001:
            cw, ch = W / z, H / z; ox = oy = 0
            for m in msgs:
                dt = t - m["t"]
                if m.get("big") and 0 <= dt < 0.6: ox = 14 * math.sin(dt * 80) * (1 - dt / 0.6); oy = 10 * math.cos(dt * 70) * (1 - dt / 0.6)
            frame = frame.transform((W, H), Image.EXTENT, ((W - cw) / 2 + ox, (H - ch) / 2 + oy, (W + cw) / 2 + ox, (H + ch) / 2 + oy), Image.BILINEAR)
        for m in msgs:
            if m.get("deleted") and 0 <= t - m["deleted"] < 0.12: frame = Image.blend(frame, Image.new("RGB", (W, H), (255, 255, 255)), 0.35)
        dd = ImageDraw.Draw(frame); dd.rectangle((0, 0, int(W * t / speech_end), 8), fill=TEAL)
        last = frame
        ff.stdin.write(frame.tobytes())
    ff.stdin.close(); ff.wait()
    def ts(x):
        ms = int(round((x % 1) * 1000)) % 1000
        return f"{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{ms:03d}"
    with open(os.path.join(B, "titlovi.srt"), "w", encoding="utf-8") as f:
        for i, sb in enumerate(subs, 1): f.write(f"{i}\n{ts(sb['start'])} --> {ts(sb['end'])}\n{' '.join(sb['words'])}\n\n")
    seen, clean = {}, []
    for tt, kd in sorted((s for s in SFX if s[0] is not None), key=lambda x: x[0]):
        if kd in seen and tt - seen[kd] < (0.08 if kd == "tick" else 0.2): continue
        seen[kd] = tt; clean.append((tt, kd))
    json.dump({"total": total, "speech_end": speech_end, "sfx": clean}, open(os.path.join(B, "render_meta.json"), "w"))
    print("frames", n, "sfx", len(clean))

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Écran de conclusion « ABONNE-TOI » de LE DARON (règle permanente depuis le 17 nov. 2026).
Produit : abonne-toi-1080x1920.png, abonne-toi-1080x1440.png (dernière slide de carrousel)
          abonne-toi-fin.mp4 (séquence de fin animée, 3,2 s, muette, 1080x1920)
Usage : python3 generer-abonne-toi.py <dossier_des_polices_ttf> <dossier_de_sortie>
Polices : archivo-black-latin-400-normal.ttf, archivo-latin-500-normal.ttf (fonts/ du dépôt, converties du woff2).
"""
import sys, os, random, subprocess, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

POL, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
NOIR = (17, 19, 24); OR = (245, 182, 66); BLANC = (255, 255, 255)
W = 1080
F = lambda s, n="archivo-black-latin-400-normal": ImageFont.truetype(os.path.join(POL, n + ".ttf"), s)
ACCROCHE = ["Pour ne rien rater", "de l'univers Steelbook !"]

def fond(h):
    y = np.linspace(0, 1, h)[:, None, None]; x = np.linspace(0, 1, W)[None, :, None]
    lueur = np.exp(-(((x - .5) / .6) ** 2 + ((y - .5) / .25) ** 2)) * np.array([60, 42, 16])
    return Image.fromarray(np.clip(np.array(NOIR) * np.ones((h, W, 1)) + lueur, 0, 255).astype("uint8")).convert("RGBA")

def points(h, seed=7):
    random.seed(seed)
    return [(random.uniform(30, 1050), random.uniform(0, h), random.uniform(3, 6), random.uniform(.3, .8), random.uniform(8, 20)) for _ in range(22)]

def composer(h, t=None, anim=False):
    """t = secondes (animation) ; anim=False -> image finale."""
    im = fond(h); ov = Image.new("RGBA", (W, h), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    e = lambda a, b: 1.0 if not anim else (lambda u: u * u * (3 - 2 * u))(max(0, min(1, (t - a) / (b - a))))
    tt = 0 if not anim else t
    for (x, y, r, a, v) in points(h):
        yy = (y - v * tt) % h; d.ellipse([x - r, yy - r, x + r, yy + r], fill=OR + (int(255 * a * .7),))
    top, bot = int(h * 0.0687), h - int(h * 0.0083) - 16 if h == 1920 else h - 96
    top = 132 if h == 1920 else 96; bot = 1904 if h == 1920 else 1344
    L = 80 * e(0, .6)
    for cx, cy, sx, sy in [(10, top, 1, 1), (1070, top, -1, 1), (10, bot, 1, -1), (1070, bot, -1, -1)]:
        d.line([(cx, cy), (cx + sx * L, cy)], fill=OR + (255,), width=6); d.line([(cx, cy), (cx, cy + sy * L)], fill=OR + (255,), width=6)
    a = int(255 * e(.2, .7)); ty = top + 41
    d.rectangle([42, ty, 52, ty + 62], fill=OR + (a,)); d.text((82, ty - 1), "LE DARON", font=F(56), fill=BLANC + (a,))
    cy = h // 2 - 40
    s = 0.85 + 0.15 * e(.5, 1.1) + (0.012 * math.sin(max(0, tt - 1.4) * 4) if anim else 0)
    bw, bh = int(900 * s), int(150 * s); a = int(255 * e(.5, 1.0))
    d.rounded_rectangle([(W - bw) // 2, cy - bh // 2, (W + bw) // 2, cy + bh // 2], radius=bh // 2, fill=OR + (a,))
    f = F(int(100 * s)); txt = "ABONNE-TOI"; w = d.textlength(txt, font=f)
    d.text(((W - w) / 2, cy - int(63 * s)), txt, font=f, fill=NOIR + (a,))
    a = int(255 * e(1.1, 1.7)); g = F(44, "archivo-latin-500-normal")
    for i, l in enumerate(ACCROCHE):
        w = d.textlength(l, font=g); d.text(((W - w) / 2, cy + 130 + i * 62), l, font=g, fill=(235, 237, 242, a))
    im.alpha_composite(ov); return im.convert("RGB")

composer(1920).save(os.path.join(OUT, "abonne-toi-1080x1920.png"))
composer(1440).save(os.path.join(OUT, "abonne-toi-1080x1440.png"))
FPS, DUREE = 30, 3.2
p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x1920", "-r", str(FPS), "-i", "-", "-an",
                      "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(OUT, "abonne-toi-fin.mp4")], stdin=subprocess.PIPE)
for i in range(int(FPS * DUREE)):
    p.stdin.write(composer(1920, i / FPS, True).tobytes())
p.stdin.close(); p.wait()

# -*- coding: utf-8 -*-
"""Sinh icon PWA cho ERP-CRM (brand AIECOS: tim #5B4FCF + accent hong #FF8C9A).
Chay: PYTHONUTF8=1 python supabase/_gen_icons.py
Xuat ra public/: icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
"""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
PRIMARY = (91, 79, 207)       # #5B4FCF
PRIMARY_DEEP = (63, 53, 168)  # #3F35A8
ACCENT = (255, 140, 154)      # #FF8C9A
WHITE = (255, 255, 255)


def vgradient(size, top, bottom):
    img = Image.new("RGB", (size, size), top)
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def draw_bars(img, size, inset):
    """Ve bieu do cot tai chinh (3 cot trang + 1 cot accent) o vung an toan."""
    d = ImageDraw.Draw(img)
    area = size - inset * 2
    x0 = inset
    baseline = inset + area
    n = 4
    gap = area * 0.10
    bw = (area - gap * (n - 1)) / n
    # ti le chieu cao tang dan, cot cuoi cao nhat = accent
    heights = [0.45, 0.62, 0.80, 1.0]
    colors = [WHITE, WHITE, WHITE, ACCENT]
    radius = int(bw * 0.28)
    for i in range(n):
        bx = x0 + i * (bw + gap)
        bh = area * heights[i]
        top = baseline - bh
        d.rounded_rectangle([bx, top, bx + bw, baseline], radius=radius, fill=colors[i])


def make(size, mode="rounded"):
    """mode: 'rounded' = bo goc + nen trong suot (manifest/favicon);
    'maskable' = vuong full-bleed, padding rong (Android adaptive);
    'apple' = vuong DAC (khong alpha, iOS tu bo goc)."""
    img = vgradient(size, PRIMARY, PRIMARY_DEEP).convert("RGBA")
    inset = int(size * (0.26 if mode == "maskable" else 0.20))
    draw_bars(img, size, inset)
    if mode == "rounded":
        radius = int(size * 0.22)
        mask = rounded_mask(size, radius)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        return out
    # maskable & apple: vuong, KHONG trong suot (iOS hien nen trong suot = den)
    return img.convert("RGB")


os.makedirs(OUT, exist_ok=True)
make(192).save(os.path.join(OUT, "icon-192.png"))
make(512).save(os.path.join(OUT, "icon-512.png"))
make(512, mode="maskable").save(os.path.join(OUT, "icon-maskable-512.png"))
make(180, mode="apple").save(os.path.join(OUT, "apple-touch-icon.png"))
print("OK -> public/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png")

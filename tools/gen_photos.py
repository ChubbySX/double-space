# -*- coding: utf-8 -*-
"""生成情侣空间网站的复古胶片风格占位照片（PIL 零依赖）。
用户之后用真实照片替换 content/photos/ 下的文件即可。
"""
import os, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(ROOT, "content", "photos")
os.makedirs(PHOTOS, exist_ok=True)

FONT = None
for p in [r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\msyhbd.ttc",
          r"C:\Windows\Fonts\simhei.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
    if os.path.exists(p):
        FONT = p
        break

def font(sz, bold=False):
    try:
        return ImageFont.truetype(FONT, sz)
    except Exception:
        return ImageFont.load_default()

def retro_grain(img, amount=12):
    """胶片颗粒噪点"""
    w, h = img.size
    px = img.load()
    for _ in range((w * h) // 8):
        x, y = random.randrange(w), random.randrange(h)
        r, g, b = px[x, y]
        d = random.randint(-amount, amount)
        px[x, y] = (max(0, min(255, r + d)), max(0, min(255, g + d)), max(0, min(255, b + d)))
    return img

def sepia_tint(img, strength=0.28):
    """暖棕复古色调"""
    img = img.convert("RGB")
    r, g, b = img.split()
    r = r.point(lambda i: min(255, int(i * 1.0 + 255 * strength * 0.5)))
    g = g.point(lambda i: min(255, int(i * (1 - strength) + 255 * strength * 0.3)))
    b = b.point(lambda i: min(255, int(i * (1 - strength) + 255 * strength * 0.1)))
    return Image.merge("RGB", (r, g, b))

def vignette(img, strength=90):
    """暗角"""
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.25, -h * 0.25, w * 1.25, h * 1.25], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(60))
    dark = Image.new("RGB", (w, h), (20, 12, 6))
    return Image.composite(img, dark, mask)

def make_scene(name, title, subtitle, palette, w=1200, h=800):
    """生成一张渐变+元素占位图"""
    c1, c2, c3 = palette
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    # 对角渐变
    for y in range(h):
        t = y / h
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        d.line([(0, y), (w, y)], fill=(r, g, b))
    # 柔和光斑
    for _ in range(5):
        x, y = random.randrange(w), random.randrange(h)
        r = random.randint(80, 260)
        blob = Image.new("RGBA", (r * 2, r * 2), (0, 0, 0, 0))
        bd = ImageDraw.Draw(blob)
        bd.ellipse([0, 0, r * 2, r * 2], fill=(255, 240, 220, 26))
        blob = blob.filter(ImageFilter.GaussianBlur(30))
        img.paste(blob, (x - r, y - r), blob)
    # 大标题文字（胶片风格手写感：居中，带日期）
    d = ImageDraw.Draw(img)
    f1 = font(64, bold=True)
    f2 = font(30)
    tw = d.textlength(title, font=f1)
    d.text(((w - tw) / 2, h * 0.30), title, font=f1, fill=(252, 242, 226, 255))
    sw = d.textlength(subtitle, font=f2)
    d.text(((w - sw) / 2, h * 0.30 + 92), subtitle, font=f2, fill=(240, 216, 180, 255))
    # 上下胶片齿孔条
    for yy in (14, h - 34):
        d.rectangle([0, yy, w, yy + 20], fill=(26, 18, 12, 255))
        for x in range(30, w - 20, 56):
            d.rectangle([x, yy + 5, x + 26, yy + 15], fill=(70, 52, 36, 255))
    img = sepia_tint(img)
    img = retro_grain(img)
    img = vignette(img)
    img.save(os.path.join(PHOTOS, name), quality=88)
    print("  [ok] " + name)

def main():
    random.seed(2025)
    make_scene("hero-film.jpg", "我们的恋爱胶片", "把回忆，定格成胶片", ((200, 150, 100), (120, 80, 45), (60, 40, 24)), 1400, 900)
    make_scene("p1.jpg", "栈桥的黄昏", "2024.07.03", ((235, 195, 140), (190, 130, 80), (100, 60, 34)))
    make_scene("p2.jpg", "海边的风", "2024.07.04", ((150, 185, 195), (100, 135, 145), (55, 75, 85)))
    make_scene("p3.jpg", "沙滩上的字", "2024.07.05", ((230, 200, 160), (190, 150, 105), (120, 85, 50)))
    make_scene("p4.jpg", "奶茶店窗边", "2024.12.20", ((245, 220, 190), (200, 160, 120), (110, 75, 45)))
    make_scene("p5.jpg", "耳机分你一半", "2024.12.24", ((90, 110, 160), (55, 70, 105), (30, 40, 65)))
    print("完成：6 张复古胶片占位照片")

if __name__ == "__main__":
    main()
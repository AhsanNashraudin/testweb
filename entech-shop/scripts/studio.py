"""ปรับรูปสินค้าที่ตัดพื้นหลังแล้วให้ดูเหมือนถ่ายในสตูดิโอเดียวกัน (ใช้ร่วมกับ make-hero.py และ make-collages.py)
- grade(): เก็บขอบ (ตัดเส้นขอบมืดจากพื้นหลังเดิม) · ปรับระดับแสงให้ไฮไลต์/เงาเท่ากันทุกรูป · ลดสีเพี้ยนในส่วนสีเทา/ขาว/ดำ
           · ใส่ทิศแสงเดียวกัน (สว่างจากซ้ายบน มืดลงทางขวาล่าง)
- backdrop(): ฉากสตูดิโอ (ผนังโค้งสีขาวอมเทา + พื้นไล่เฉด)
- contact_shadow(): เงาใต้สินค้าแบบเดียวกันทุกชิ้น
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def grade(im: Image.Image) -> Image.Image:
    im = im.convert('RGBA')
    a = im.getchannel('A')
    # ขอบ: หด 1px แล้วเบลอนิด ๆ — ตัดเส้นขอบที่ติดสีพื้นหลังเดิม (โรงงาน/พื้นมืด)
    a = a.point(lambda v: 255 if v > 128 else v).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    rgb = np.asarray(im.convert('RGB')).astype(np.float32)
    mask = np.asarray(a) > 200
    if mask.sum() < 50:
        return im
    px = rgb[mask]
    lum = px @ np.array([0.299, 0.587, 0.114], np.float32)
    # 1) ระดับแสง: ไฮไลต์ (p99.5) → 246 · เงาเข้มสุด (p0.5) ลึกลงเล็กน้อย — สีเดิมของสินค้าไม่เปลี่ยน (สเกลทุกช่องเท่ากัน)
    lo, hi = np.percentile(lum, 0.5), np.percentile(lum, 99.5)
    tlo = lo * 0.8
    k = (246 - tlo) / max(hi - lo, 1)
    rgb = (rgb - lo) * k + tlo
    # 2) สีเพี้ยน: ใช้พิกเซลที่เกือบไม่มีสี (เทา/ขาว/ดำ) เป็นตัวอ้างอิง ดึงให้เป็นกลาง 60%
    px = rgb[mask]
    mx, mn = px.max(1), px.min(1)
    sat = (mx - mn) / np.maximum(mx, 1)
    neutral = (sat < 0.12) & (mx > 40) & (mx < 235)
    if neutral.mean() > 0.04:
        m = px[neutral].mean(0)
        gain = 1 + 0.6 * (m.mean() / np.maximum(m, 1) - 1)
        rgb *= gain
    # 3) ทิศแสงเดียวกัน: สว่างจากซ้ายบน
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    gx = np.clip((np.arange(rgb.shape[1]) - x0) / max(x1 - x0, 1), 0, 1)
    gy = np.clip((np.arange(rgb.shape[0]) - y0) / max(y1 - y0, 1), 0, 1)
    light = (1.07 - 0.15 * gx)[None, :] * (1.03 - 0.08 * gy)[:, None]
    rgb *= light[..., None]
    out = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
    out.putalpha(a)
    return out


def backdrop(w: int, h: int, horizon: float = 0.72) -> Image.Image:
    """ฉากสตูดิโอ: ผนังขาวสว่างตรงกลาง ไล่เทาอ่อนออกขอบ · พื้นเทาอมฟ้าอ่อน รอยต่อผนัง-พื้นนุ่ม (ผนังโค้ง)"""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w * 0.5, h * 0.42
    r = np.sqrt(((xx - cx) / (w * 0.75)) ** 2 + ((yy - cy) / (h * 0.8)) ** 2)
    wall = np.clip(1 - 0.06 * r ** 1.8, 0, 1)
    t = np.clip((yy / h - horizon) / 0.12 + 0.5, 0, 1)  # รอยต่อผนัง-พื้นแบบโค้ง (ไม่มีเส้น)
    t = t * t * (3 - 2 * t)
    shade = wall * (1 - 0.035 * t)
    base = np.array([247, 249, 251], np.float32)
    floor_tint = np.array([236, 241, 246], np.float32)
    col = (base * (1 - t[..., None]) + floor_tint * t[..., None]) * shade[..., None]
    return Image.fromarray(np.clip(col, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')


def contact_shadow(canvas: Image.Image, x: float, base: float, width: float, strength: float = 1.0):
    """เงา 2 ชั้นแบบเดียวกันทุกชิ้น: เงาแคบเข้มชิดพื้น + เงากว้างนุ่ม"""
    W, H = canvas.size
    for spread, hgt, alpha, blur in ((0.04, 9, 120, 6), (0.18, 26, 55, 18)):
        sh = Image.new('L', (W, H), 0)
        ImageDraw.Draw(sh).ellipse((x - width * spread, base - hgt * 0.5, x + width * (1 + spread), base + hgt * 0.6), fill=int(alpha * strength))
        canvas.paste((20, 32, 48, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(blur)))

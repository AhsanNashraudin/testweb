"""รูปรวมสินค้าประจำหมวด (สินค้าเรียงแถวเดียว ซ้อนกันเล็กน้อยให้ดูมีมิติ — ชิ้นกลางอยู่หน้าสุด) → public/images/products/cat-<หมวด>-studio.jpg (เปลี่ยนชื่อไฟล์เมื่อแก้รูป เพื่อไม่ให้ cache รูปเก่า)
ใช้ในหน้าแรก (หมวดหมู่) และเมนูสินค้า · อ่านรูปสินค้าที่ตัดพื้นหลังแล้วใน public/images/products
รัน: python3 scripts/make-collages.py [หมวด ...]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove, new_session
sys.path.insert(0, str(Path(__file__).resolve().parent))
from studio import grade, backdrop, contact_shadow  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public/images/products'
S = 800
# ลำดับซ้าย→ขวา · ชิ้นกลางอยู่หน้าสุดและใหญ่สุด
SETS = {
    'water-tanks': ['tank-grand-stone', 'tank-cw-blue', 'tank-natural-design'],
    'septic-tanks': ['septic-polytec-t', 'nano'],
    'grease-traps': ['grease-kg', 'grease-set', 'grease-ku'],
    # ประตูมี 20 แบบ → เลือก 5 แบบที่สี/ลายต่างกันชัด (ลูกค้าขอ "เลือกมา 5 อันแล้วเรียงกัน")
    'fiberglass-doors': [f'door-{c}' for c in ['edp-03', 'edp-06', 'edp-04', 'edp-07', 'edm-13']],
    'wall-bins': ['wallbin-flat', 'wallbin-louver'],
    'fiberglass-water-tanks': ['frp_septic'],  # ลูกค้าขอเอาถังเก็บน้ำไฟเบอร์กลาส (tank_big) ออกจากรูปหมวด
    # กระถาง: แถวหลังทรงสูง/ทรงยาว แถวหน้าทรงชาม (แนวทางจากรูปตัวอย่างของลูกค้า)
    'planters': {'back': ['planter-trough', 'planter-square-set'], 'front': ['planter-round', 'planter-bowl-pond', 'planter-low-bowl']},
}
SKIP_DEFAULT: set[str] = set()
session = new_session('isnet-general-use')


def obj(name):
    png = ROOT / f'assets/product-originals/{name}.png'  # ต้นฉบับที่มีพื้นโปร่งใสอยู่แล้ว (กระถางจากลูกค้า) ใช้ได้เลย
    if png.exists():
        im = Image.open(png).convert('RGBA')
        return grade(im.crop(im.getchannel('A').getbbox()))
    rgba = remove(Image.open(SRC / f'{name}.jpg').convert('RGB'), session=session)
    a = rgba.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    rgba.putalpha(a)
    return grade(rgba.crop(a.getbbox()))


def place(canvas, im, x, base):
    contact_shadow(canvas, x, base, im.width)
    canvas.alpha_composite(im, (int(x), int(base - im.height)))


def lineup(items, width, max_h, overlap=0.18, edge=0.86):
    """ปรับขนาดให้แถวเต็มความกว้าง: ชิ้นกลางใหญ่สุด ชิ้นริมเล็กลงเล็กน้อย (มิติใกล้-ไกล) · คืน [(รูป, x)]"""
    n = len(items)
    mid = (n - 1) / 2
    depth = [1 - (1 - edge) * (abs(i - mid) / mid if mid else 0) for i in range(n)]
    hs = [max_h * d for d in depth]
    ws = [im.width * h / im.height for im, h in zip(items, hs)]
    total = sum(ws) - overlap * sum(ws[1:]) if n > 1 else ws[0]
    k = min(1, width / total)
    out, x = [], (S - total * k) / 2
    for i, (im, h, w) in enumerate(zip(items, hs, ws)):
        r = im.resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS)
        out.append((r, x, depth[i]))
        x += w * k * (1 - overlap)
    return out


def collage(spec):
    """สินค้าเรียงแถวเดียวเต็มกรอบ (ลูกค้าขอให้สินค้าใหญ่ขึ้น เรียงกัน) · กระถาง = 2 แถว หน้า-หลัง"""
    canvas = backdrop(S, S, horizon=0.66)  # ฉากสตูดิโอเดียวกันทุกหมวด
    if isinstance(spec, dict):
        back = lineup([obj(n) for n in spec['back']], S * 0.86, S * 0.5, overlap=0.06, edge=1)
        front = lineup([obj(n) for n in spec['front']], S * 0.96, S * 0.36, overlap=0.12, edge=0.92)
        for im, x, _ in back:
            place(canvas, im, x, S * 0.60)
        for im, x, _ in sorted(front, key=lambda t: t[2]):
            place(canvas, im, x, S * 0.90)
        return canvas.convert('RGB')
    row = lineup([obj(n) for n in spec], S * 0.94, S * (0.72 if len(spec) == 1 else 0.78), overlap=0.28 if len(spec) > 2 else 0.12)
    # ชิ้นทรงเตี้ย-กว้าง (เช่น ถังดักไขมัน) ไม่ชิดขอบล่าง: จัดกลุ่มให้อยู่กึ่งกลางแนวตั้ง
    tallest = max(im.height for im, _, _ in row)
    base0 = min(S * 0.88, (S + tallest) / 2 + S * 0.04)
    for im, x, d in sorted(row, key=lambda t: t[2]):  # วาดชิ้นไกลก่อน ชิ้นกลาง (ใกล้สุด) ทับด้านหน้า
        place(canvas, im, x, base0 - (1 - d) * S * 0.25)
    return canvas.convert('RGB')


if __name__ == '__main__':
    for cat in sys.argv[1:] or [c for c in SETS if c not in SKIP_DEFAULT]:
        collage(SETS[cat]).save(SRC / f'cat-{cat}-studio.jpg', quality=86, optimize=True)
        print('✓', cat, flush=True)

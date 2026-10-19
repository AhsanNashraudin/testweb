"""รูปรวมสินค้าประจำหมวด (หลายชิ้นเรียงซ้อนกันแบบพัด) → public/images/products/cat-<หมวด>.jpg
ใช้ในหน้าแรก (หมวดหมู่) และเมนูสินค้า · อ่านรูปสินค้าที่ตัดพื้นหลังแล้วใน public/images/products
รัน: python3 scripts/make-collages.py [หมวด ...]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove, new_session

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'public/images/products'
S = 800
# ลำดับซ้าย→ขวา · ชิ้นกลางอยู่หน้าสุดและใหญ่สุด
SETS = {
    'water-tanks': ['tank-cw-blue', 'tank-grand-stone', 'tank-natural-design', 'tank-polytec-ug', 'amazon-timber-2', 'amazon-sofa-2'],
    'septic-tanks': ['septic-polytec-t', 'nano'],
    'grease-traps': ['grease-kg', 'grease-ku', 'grease-set'],
    'fiberglass-doors': [f'door-{c}' for c in ['edm-01', 'edm-03', 'edm-06', 'edm-07', 'edm-08', 'edm-11', 'edm-12', 'edm-13', 'edm-14', 'edm-15',
                                               'edm-16', 'edp-02', 'edp-03', 'edp-04', 'edp-06', 'edp-07', 'edp-08', 'edp-09', 'edp-10', 'edp-11']],
    'wall-bins': ['wallbin-flat', 'wallbin-louver'],
    'fiberglass-water-tanks': ['tank_big', 'frp_septic'],
    'planters': ['planter-round', 'planter-bowl-pond', 'planter-low-bowl', 'planter-trough', 'planter-square-set'],
}
session = new_session('isnet-general-use')


def obj(name):
    png = ROOT / f'assets/product-originals/{name}.png'  # ต้นฉบับที่มีพื้นโปร่งใสอยู่แล้ว (กระถางจากลูกค้า) ใช้ได้เลย
    if png.exists():
        im = Image.open(png).convert('RGBA')
        return im.crop(im.getchannel('A').getbbox())
    rgba = remove(Image.open(SRC / f'{name}.jpg').convert('RGB'), session=session)
    a = rgba.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    rgba.putalpha(a)
    return rgba.crop(a.getbbox())


def collage(names):
    """จัดเป็นตารางแบบแคตตาล็อก (ตามตัวอย่างรูปประตู 20 แบบของลูกค้า) · แถวสุดท้ายที่ไม่เต็มจัดกึ่งกลาง"""
    items = [obj(n) for n in names]
    n = len(items)
    cols = {1: 1, 2: 2, 3: 3, 4: 2, 5: 3, 6: 3}.get(n, 5)
    rows = -(-n // cols)
    pad, gap = 48, 18
    cw = (S - 2 * pad - gap * (cols - 1)) / cols
    ch = (S - 2 * pad - gap * (rows - 1)) / rows
    # แต่ละชิ้นย่อให้พอดีช่องของตัวเอง (ชิ้นกว้าง/ชิ้นสูงไม่ทำให้ชิ้นอื่นเล็กลง)
    h = ch
    sized = []
    for im in items:
        k = min(cw * 0.94 / im.width, ch * 0.94 / im.height)
        sized.append(im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS))
    # ความสูงจริงของแต่ละแถว → จัดทั้งชุดให้อยู่กึ่งกลางภาพ
    row_h = [max(im.height for im in sized[r * cols:(r + 1) * cols]) for r in range(rows)]
    cy = (S - sum(row_h) - gap * (rows - 1)) / 2
    canvas = Image.new('RGBA', (S, S), (255, 255, 255, 255))
    for r in range(rows):
        row = sized[r * cols:(r + 1) * cols]
        row_w = len(row) * cw + gap * (len(row) - 1)
        x0 = (S - row_w) / 2
        cy += row_h[r]
        base = cy
        cy += gap
        for k, im in enumerate(row):
            x = int(x0 + k * (cw + gap) + (cw - im.width) / 2)
            y = int(base - im.height)
            sh = Image.new('L', (S, S), 0)
            ImageDraw.Draw(sh).ellipse((x + im.width * 0.05, base - 5, x + im.width * 0.95, base + 7), fill=60)
            canvas.paste((0, 0, 0, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(5)))
            canvas.alpha_composite(im, (x, y))
    return canvas.convert('RGB')


if __name__ == '__main__':
    for cat in sys.argv[1:] or SETS:
        collage(SETS[cat]).save(SRC / f'cat-{cat}.jpg', quality=86, optimize=True)
        print('✓', cat, flush=True)

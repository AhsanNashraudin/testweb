"""รูปปกบทความ/กิจกรรม CSR (กราฟิกแบรนด์: พื้นไล่สี + ไอคอน + รูปสินค้าจริง — ไม่ใช่ภาพถ่ายกิจกรรม)
รัน: python3 scripts/make-covers.py  → public/images/articles/<slug>.jpg"""
import io, re, sys
from pathlib import Path
import cairosvg
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ICONS = dict(re.findall(r"^\s+(\w+): '([^']+)'", (ROOT / 'src/components/icons.tsx').read_text(), re.M))
W, H = 1200, 675
NAVY9, NAVY7, CYAN7 = (22, 48, 79), (37, 75, 124), (0, 114, 177)

COVERS = {  # slug: (รูปสินค้า หรือ None, ไอคอนหลัก, ไอคอนประกอบ)
    'grease-trap-size-guide': ('grease-set', 'utensils', ['drop', 'capsule']),
    'water-tank-donation-ban-sap-duea-school': ('tank-cw-blue', 'school', ['heart', 'drop']),
    'entech-for-community-water-tank-donation': ('tank-grand-stone', 'heart', ['drop', 'school']),
    'fiberglass-doors-for-temples-schools-army': ('door-edp-07', 'door', ['heart', 'school']),
    'learning-materials-nakhon-ratchasima-schools': (None, 'book', ['school', 'heart']),
}

def icon(name, size, color='white', width=1.6):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"><path d="{ICONS[name]}"/></svg>'
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode()))).convert('RGBA')

def background():
    bg = Image.new('RGB', (W, H))
    px = bg.load()
    for y in range(H):
        for x in range(W):
            t = (x / W * 0.65 + y / H * 0.35)
            a, b, u = (NAVY9, NAVY7, t * 2) if t < 0.5 else (NAVY7, CYAN7, (t - 0.5) * 2)
            px[x, y] = tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3))
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    d.ellipse((800, -220, 1350, 330), fill=(0, 158, 202, 90))
    d.ellipse((-160, 420, 380, 900), fill=(255, 255, 255, 40))
    bg = bg.convert('RGBA')
    bg.alpha_composite(glow.filter(ImageFilter.GaussianBlur(60)))
    return bg

def make(slug, product, main, extras):
    img = background()
    # แผงขาวมุมมนด้านขวา + รูปสินค้า (หรือไอคอนใหญ่ถ้าไม่มีรูป)
    panel = (660, 70, 1130, 605)
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((panel[0] + 10, panel[1] + 22, panel[2] + 10, panel[3] + 22), 48, fill=(0, 0, 0, 90))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(24)))
    ImageDraw.Draw(img).rounded_rectangle(panel, 48, fill=(255, 255, 255, 255))
    pw, ph = panel[2] - panel[0] - 60, panel[3] - panel[1] - 60
    if product:
        p = Image.open(ROOT / f'public/images/products/{product}.jpg').convert('RGB')
        p.thumbnail((pw, ph), Image.LANCZOS)
        img.paste(p, (panel[0] + (panel[2] - panel[0] - p.width) // 2, panel[1] + (panel[3] - panel[1] - p.height) // 2))
    else:
        big = icon(main, 300, '#254b7c', 1.4)
        img.alpha_composite(big, (panel[0] + (panel[2] - panel[0] - 300) // 2, panel[1] + (panel[3] - panel[1] - 300) // 2))
    # ไอคอนหลักในกล่องโปร่ง + ไอคอนประกอบเล็ก ๆ ด้านซ้าย
    box = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(box).rounded_rectangle((90, 170, 330, 410), 56, fill=(255, 255, 255, 38), outline=(255, 255, 255, 70), width=2)
    img.alpha_composite(box)
    img.alpha_composite(icon(main, 150), (135, 215))
    for i, name in enumerate(extras):
        x, y = 380 + i * 110, 470 - i * 60
        chip = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(chip).ellipse((x, y, x + 90, y + 90), fill=(255, 255, 255, 30))
        img.alpha_composite(chip)
        img.alpha_composite(icon(name, 54), (x + 18, y + 18))
    # จุดตกแต่ง
    d = ImageDraw.Draw(img)
    for r in range(4):
        for c in range(6):
            d.ellipse((95 + c * 22, 520 + r * 22, 101 + c * 22, 526 + r * 22), fill=(255, 255, 255, 70))
    out = ROOT / f'public/images/articles/{slug}.jpg'
    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert('RGB').save(out, quality=85, optimize=True)
    print('✓', out.relative_to(ROOT))

for slug, args in COVERS.items():
    if len(sys.argv) == 1 or slug in sys.argv[1:]:
        make(slug, *args)

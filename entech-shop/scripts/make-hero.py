"""รูปหน้าปก: จัดเรียงรูปสินค้าจริง (ตัดพื้นหลังแล้วใน assets/hero/) ให้มีมิติ หน้า-หลัง พร้อมเงาพื้นและเงาสะท้อน
ผลลัพธ์: public/images/hero-studio.webp (พื้นหลังโปร่งใส วางบนพื้นสีของ hero ได้ทุกสี)
ใช้: python3 scripts/make-hero.py
"""
from PIL import Image, ImageDraw, ImageFilter
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from studio import grade, contact_shadow

W, H = 1600, 1260
FLOOR = 1080  # เส้นพื้นของแถวหน้า
# (ไฟล์, ความสูงพิกเซล, กึ่งกลาง x, ระยะยกจากพื้น (แถวหลังอยู่สูงกว่า), ความลึก 0=หน้า 1=หลังสุด)
ITEMS = [
    ('ND', 640, 260, 150, 1.0),
    ('CW-1000', 900, 930, 120, 0.8),
    ('CW1000CS', 760, 520, 60, 0.45),
    ('PT-1600T', 560, 1230, 0, 0.0),
]

canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))

# พื้นวงรีจาง ๆ ใต้สินค้าทั้งหมด
floor = Image.new('L', (W, H), 0)
ImageDraw.Draw(floor).ellipse((60, FLOOR - 230, W - 40, FLOOR + 90), fill=70)
floor = floor.filter(ImageFilter.GaussianBlur(50))
canvas.paste(Image.new('RGBA', (W, H), (30, 64, 120, 255)), (0, 0), floor.point(lambda v: v * 0.35))

for name, h, cx, lift, depth in ITEMS:
    # ทุกชิ้นผ่านการปรับแสง/สี/ทิศแสงชุดเดียวกัน → ดูเหมือนถ่ายในสตูดิโอเดียวกัน
    im = grade(Image.open(f'assets/hero/{name}.png'))
    k = h / im.height
    im = im.resize((round(im.width * k), h), Image.LANCZOS)
    x, base = cx - im.width // 2, FLOOR - lift
    contact_shadow(canvas, x, base, im.width, strength=1.15)
    # เงาสะท้อนบนพื้นมันวาวแบบสตูดิโอ: สั้นและจางมาก ค่อย ๆ หายไป
    ref = im.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, im.width, min(90, im.height)))
    fade = Image.linear_gradient('L').rotate(180).resize(ref.size).point(lambda v: v * 0.10)
    ref.putalpha(Image.composite(fade, Image.new('L', ref.size, 0), ref.getchannel('A')))
    canvas.alpha_composite(ref, (x, base + 2))
    canvas.alpha_composite(im, (x, base - im.height))

bbox = canvas.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
out = canvas.crop((max(0, bbox[0] - 20), max(0, bbox[1] - 20), min(W, bbox[2] + 20), min(H, bbox[3] + 10)))
out.save('public/images/hero-studio.webp', quality=88, method=6)
print(out.size)

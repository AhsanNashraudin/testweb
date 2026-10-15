"""ตัดพื้นหลังรูปสินค้า (ที่ไม่ใช่ประตู) แล้ววางบนพื้นขาว 800x800 เท่ากันทุกรูป
- อ่านจาก assets/product-originals/ เสมอ (รันซ้ำได้)
- ใช้ rembg (isnet-general-use) หาวัตถุ แล้วครอปให้พอดีวัตถุ ย่อให้อยู่ในกรอบ 80%
- วางกึ่งกลางแนวนอน ฐานอยู่ที่ 90% ของความสูง มีเงาพื้นอ่อน ๆ
ใช้: pip install "rembg[cpu]" แล้ว python3 scripts/cutout-products.py
"""
import os, sys
from PIL import Image, ImageFilter, ImageDraw
from rembg import remove, new_session

ORIG, DEST = 'assets/product-originals', 'public/images/products'
S = 800
NAMES = ['tank-cw-blue', 'tank-grand-stone', 'tank-natural-design', 'tank-polytec-ug', 'amazon-timber-2',
         'amazon-sofa-2', 'florist', 'garden-log', 'septic-polytec-t', 'nano', 'grease-kg', 'grease-ku',
         'grease-set', 'wallbin-louver', 'wallbin-flat', 'tank_big', 'frp_septic', 'grease']  # planter: ภาพต้นฉบับซับซ้อน (ต้นไม้+พื้นหลังถนน) ตัดไม่ได้ ใช้ภาพเดิม รอภาพสตูดิโอ
session = new_session('isnet-general-use')


def cut(name):
    img = Image.open(f'{ORIG}/{name}.jpg').convert('RGB')
    rgba = remove(img, session=session, alpha_matting=False)
    alpha = rgba.getchannel('A').point(lambda v: 255 if v > 16 else 0)
    box = alpha.getbbox()
    if not box:
        raise RuntimeError(f'no object found in {name}')
    obj = rgba.crop(box)
    k = min(S * 0.8 / obj.width, S * 0.8 / obj.height)
    obj = obj.resize((max(1, round(obj.width * k)), max(1, round(obj.height * k))), Image.LANCZOS)
    x, y = (S - obj.width) // 2, int(S * 0.9) - obj.height
    canvas = Image.new('RGBA', (S, S), (255, 255, 255, 255))
    sh = Image.new('L', (S, S), 0)
    ImageDraw.Draw(sh).ellipse((x - 10, y + obj.height - 10, x + obj.width + 10, y + obj.height + 14), fill=60)
    canvas.paste((0, 0, 0, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(10)))
    canvas.alpha_composite(obj, (x, y))
    return canvas.convert('RGB')


if __name__ == '__main__':
    only = sys.argv[1:] or NAMES
    for n in only:
        cut(n).save(f'{DEST}/{n}.jpg', quality=88, optimize=True, progressive=True)
        print('✓', n, flush=True)

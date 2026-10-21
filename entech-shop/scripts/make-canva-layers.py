import sys, json
sys.path.insert(0, 'scripts')
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from studio import grade
W, H = 1600, 1200
FLOOR = 1040
ITEMS = [('ND', 620, 270, 140), ('CW-1000', 870, 930, 112), ('CW1000CS', 735, 540, 56), ('PT-1600T', 545, 1220, 0)]
out = []
for name, h, cx, lift in ITEMS:
    im = grade(Image.open(f'assets/hero/{name}.png'))
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    padx, padb = int(im.width * 0.22), 70
    L = Image.new('RGBA', (im.width + 2 * padx, h + padb), (0, 0, 0, 0))
    base = h
    for spread, hh, a, blur in ((0.04, 10, 125, 6), (0.18, 28, 60, 18)):
        sh = Image.new('L', L.size, 0)
        ImageDraw.Draw(sh).ellipse((padx - im.width * spread, base - hh * 0.5, padx + im.width * (1 + spread), base + hh * 0.6), fill=a)
        L.paste((20, 32, 48, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(blur)))
    ref = im.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, im.width, 60))
    fade = Image.linear_gradient('L').rotate(180).resize(ref.size).point(lambda v: v * 0.08)
    ref.putalpha(Image.composite(fade, Image.new('L', ref.size, 0), ref.getchannel('A')))
    L.alpha_composite(ref, (padx, base + 2))
    L.alpha_composite(im, (padx, 0))
    L.save(f'/tmp/claude-0/canva/{name}.png')
    out.append(dict(name=name, left=cx - im.width // 2 - padx, top=FLOOR - lift - h, width=L.width, height=L.height))
# ฉากสตูดิโอ: กลางสว่าง ขอบกลืนเป็นสีพื้น hero (#f3f7fb) + พื้นไล่เฉดอ่อน
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
edge = np.array([243, 247, 251], np.float32); center = np.array([255, 255, 255], np.float32)
r = np.clip(np.sqrt(((xx - W * .55) / (W * .5)) ** 2 + ((yy - H * .5) / (H * .55)) ** 2), 0, 1)
col = center * (1 - r[..., None] ** 1.5) + edge * (r[..., None] ** 1.5)
floor = np.clip((yy - (FLOOR - 170)) / 120, 0, 1) * (1 - np.clip(np.abs(xx - W * .55) / (W * .5), 0, 1)) * (1 - np.clip((yy - FLOOR - 80) / 80, 0, 1))
col = col * (1 - 0.045 * floor[..., None]) + np.array([214, 226, 238]) * 0.045 * floor[..., None]
Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).save('/tmp/claude-0/canva/backdrop.png')
json.dump(out, open('/tmp/claude-0/canva/layout.json', 'w'), indent=1)
# ตัวอย่างประกอบภาพ
bg = Image.open('/tmp/claude-0/canva/backdrop.png').convert('RGBA')
for o in out:
    bg.alpha_composite(Image.open(f"/tmp/claude-0/canva/{o['name']}.png"), (o['left'], o['top']))
bg.convert('RGB').resize((800, 600)).save('/tmp/claude-0/canva/preview.jpg')
print(json.dumps(out))

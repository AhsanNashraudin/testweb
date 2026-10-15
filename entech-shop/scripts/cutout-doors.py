"""ตัดพื้นหลังรูปประตู แล้ววางบนพื้นขาวขนาดเท่ากันทุกรูป
- ผลลัพธ์ 800x1200 ประตูสูง 86% ของภาพ จัดกึ่งกลาง มีเงาพื้นอ่อน ๆ
- ประตูเป็นทรงสี่เหลี่ยม จึงฟิตเส้นตรง 4 ด้านจาก mask ของ AI → ขอบคมและเหมือนกันทุกบาน
- ประตูสีขาวบนฉากเทาอ่อน: ถ้าโมเดลแรกจับไม่ครบ จะลองโมเดล u2net กับภาพที่เร่งคอนทราสต์อัตโนมัติ
ต้นฉบับเก็บที่ assets/door-originals/  ·  ใช้: pip install "rembg[cpu]" แล้ว python3 scripts/cutout-doors.py
"""
import glob, os, shutil
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from rembg import remove, new_session

SRC, ORIG = 'public/images/products', 'assets/door-originals'
W, H, DOOR_H = 800, 1200, int(1200 * 0.86)
# รูปเดิมที่ประตูชิดผนังขาวจนแยกไม่ได้ → ใช้รูปตัดแล้วของรุ่นที่แบบเดียวกัน
SAME_AS = {'door3.jpg': 'door-edm-01.jpg'}
isnet, u2net = new_session('isnet-general-use'), new_session('u2net')


def fit_quad(mask: np.ndarray):
    """ฟิตเส้นตรงซ้าย/ขวา/บน/ล่างจาก mask แล้วคืนมุม 4 มุม + คะแนนความพอดี"""
    m = mask > 128
    ys, xs = np.nonzero(m)
    if len(ys) < 1000: return None, 0
    t, b = np.percentile(ys, [1, 99]); l, r = np.percentile(xs, [1, 99])
    def line(coords, idx):  # robust linear fit: ตัด outlier แล้วฟิตใหม่ → (สัมประสิทธิ์, จำนวนจุดที่ตรงเส้น)
        idx, coords = np.asarray(idx, float), np.asarray(coords, float)
        p = np.polyfit(idx, coords, 1)
        keep = np.abs(np.polyval(p, idx) - coords) < 3
        if keep.sum() > 10: p = np.polyfit(idx[keep], coords[keep], 1)
        return p, keep.mean()
    def pair(c1, c2, idx):
        """ขอบตรงข้ามของประตูต้องขนานกัน: ถ้าความชันต่างกัน ใช้ความชันของด้านที่ฟิตได้ดีกว่า"""
        (p1, k1), (p2, k2) = line(c1, idx), line(c2, idx)
        # รูปถ่ายหน้าตรงในสตูดิโอ: ขอบที่เอียงเกิน ~0.7° คือ mask ผิด → ปรับให้ตรง (ใช้ค่ามัธยฐาน)
        flat = lambda c: np.array([0.0, np.median(c)])
        if abs(p1[0]) > 0.012: p1 = flat(c1)
        if abs(p2[0]) > 0.012: p2 = flat(c2)
        if abs(p1[0] - p2[0]) > 0.006:
            slope = p1[0] if k1 >= k2 else p2[0]
            idx = np.asarray(idx, float)
            fix = lambda c: np.array([slope, np.median(np.asarray(c, float) - slope * idx)])
            p1, p2 = (p1, fix(c2)) if k1 >= k2 else (fix(c1), p2)
        return p1, p2
    rows = np.arange(int(t + (b - t) * .08), int(b - (b - t) * .08))
    rows = [y for y in rows if m[y].any()]
    left, right = pair([np.argmax(m[y]) for y in rows], [len(m[y]) - 1 - np.argmax(m[y][::-1]) for y in rows], rows)
    cols = np.arange(int(l + (r - l) * .12), int(r - (r - l) * .12))
    cols = [x for x in cols if m[:, x].any()]
    top, bot = pair([np.argmax(m[:, x]) for x in cols], [m.shape[0] - 1 - np.argmax(m[::-1, x]) for x in cols], cols)
    def cross(v, h):  # x = v0*y+v1 , y = h0*x+h1
        y = (h[0] * v[1] + h[1]) / (1 - h[0] * v[0]); return (v[0] * y + v[1], y)
    quad = [cross(left, top), cross(right, top), cross(right, bot), cross(left, bot)]
    poly = Image.new('L', mask.shape[::-1], 0); ImageDraw.Draw(poly).polygon(quad, fill=255)
    p = np.asarray(poly) > 0
    iou = (p & m).sum() / max((p | m).sum(), 1)
    height = quad[3][1] - quad[0][1]
    return quad, iou * min(1, height / (mask.shape[0] * .75))


def best_quad(img: Image.Image):
    cands = [(img, isnet)]
    g = np.asarray(img.convert('L'), float)
    lo, hi = np.percentile(g, [40, 99.5])  # เร่งคอนทราสต์ช่วงสว่าง (ประตูขาว vs ฉากเทา)
    boost = np.clip((np.asarray(img, float) - lo) * 255 / max(hi - lo, 1), 0, 255).astype('uint8')
    fixed = np.clip((np.asarray(img, float) - 150) * 3, 0, 255).astype('uint8')
    cands += [(Image.fromarray(boost), u2net), (Image.fromarray(fixed), u2net), (img, u2net)]
    best = (None, 0)
    for x, s in cands:
        try:
            q, score = fit_quad(np.asarray(remove(x, session=s, only_mask=True)))
        except (TypeError, ValueError, np.linalg.LinAlgError):
            continue  # mask ใช้ไม่ได้ → ลองวิธีถัดไป
        if score > best[1]: best = (q, score)
        if score > .97: break
    return best


def compose(img: Image.Image, quad):
    k = 4  # วาด mask ใหญ่ 4 เท่าแล้วย่อ → ขอบเนียน
    big = Image.new('L', (img.width * k, img.height * k), 0)
    ImageDraw.Draw(big).polygon([(x * k, y * k) for x, y in quad], fill=255)
    cut = img.convert('RGBA'); cut.putalpha(big.resize(img.size, Image.LANCZOS))
    cut = cut.crop(cut.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    s = min(DOOR_H / cut.height, W * .8 / cut.width)
    cut = cut.resize((round(cut.width * s), round(cut.height * s)), Image.LANCZOS)
    x, y = (W - cut.width) // 2, (H - cut.height) // 2 + 20
    canvas = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).ellipse((x - 20, y + cut.height - 14, x + cut.width + 20, y + cut.height + 22), fill=70)
    canvas.paste((0, 0, 0, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(14)))
    canvas.alpha_composite(cut, (x, y))
    return canvas.convert('RGB')


if __name__ == '__main__':
    os.makedirs(ORIG, exist_ok=True)
    files = sorted(glob.glob(f'{SRC}/door-ed*.jpg')) + [f'{SRC}/door_p.jpg', f'{SRC}/door3.jpg']
    for f in files:
        name = os.path.basename(f)
        orig = os.path.join(ORIG, name)
        if not os.path.exists(orig): shutil.copy2(f, orig)  # รันซ้ำได้: อ่านจากต้นฉบับเสมอ
        if name in SAME_AS:
            shutil.copy2(os.path.join(SRC, SAME_AS[name]), f); print('=', name, '←', SAME_AS[name]); continue
        img = Image.open(orig).convert('RGB')
        quad, score = best_quad(img)
        compose(img, quad).save(f, quality=85, optimize=True, progressive=True)
        print('✓' if score > .9 else '⚠', name, f'score={score:.3f}')

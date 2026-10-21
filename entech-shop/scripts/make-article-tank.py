"""รูปปกบทความ "เลือกขนาดถังเก็บน้ำ" — ใช้รูปถังจริง (CW1000CS) + ไอคอนการใช้น้ำในบ้าน (ไม่มีภาพคน/ภาพ AI)
ผลลัพธ์: public/images/articles/water-tank-size-guide-v2.jpg (1200×800 · เนื้อหาสำคัญอยู่ในแถบกลาง 16:9 สำหรับการ์ดบทความ)
ใช้: python3 scripts/make-article-tank.py
"""
import base64, io
import cairosvg
from PIL import Image

W, H = 1200, 800
FONT = '/root/.fonts/plexthai-thai700.ttf'  # IBM Plex Sans Thai Bold (ฟอนต์เดียวกับหน้าเว็บ)
tank = Image.open('assets/hero/CW1000CS.png').convert('RGBA')
th = 540
tank = tank.resize((round(tank.width * th / tank.height), th), Image.LANCZOS)
buf = io.BytesIO(); tank.save(buf, 'PNG')
tank_b64 = base64.b64encode(buf.getvalue()).decode()
tx, base = 200, 715  # ซ้ายของถัง, เส้นพื้น
ty = base - th
cx_top = tx + tank.width / 2

ICONS = {  # เส้น 24×24
    'shower': 'M4 21V7a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4v1 M9 8h8 M10 12v1 M13 12v1 M16 12v1 M10 16v1 M13 16v1 M16 16v1 M11.5 19v1 M14.5 19v1',
    'faucet': 'M4 10h9a3 3 0 0 1 3 3v1 M7 10V7h6v3 M10 7V4 M8 4h4 M16 18c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.5 2-3.5 2-3.5s2 2 2 3.5Z',
    'users': 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M2 21a7 7 0 0 1 14 0 M16 3.5a4 4 0 0 1 0 7.5 M22 21a7 7 0 0 0-4.5-6.5',
    'washer': 'M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z M4 7h16 M7 4.5h1 M10 4.5h1 M12 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M9.5 14.5c1-1 2-1 3 0s2 1 3 0',
    'toilet': 'M6 3h5v7H6Z M4 10h15a0 0 0 0 1 0 0 7 7 0 0 1-7 7H11a7 7 0 0 1-7-7Z M9 17l-1 4h8l-1-4',
}
# (ไอคอน, ข้อความ, x, y) — เรียงเป็นโค้งจากยอดถังไปทางขวา
# เรียงเป็นแนวโค้งทางขวาของถัง · ป้ายข้อความอยู่ขวาของวงกลม · เส้นประลากแนวนอนจากขอบถัง (ไม่ตัดกัน)
BUBBLES = [('shower', 'อาบน้ำ', 700, 150), ('faucet', 'ทำครัว ล้างจาน', 745, 270), ('washer', 'ซักผ้า', 765, 390),
           ('toilet', 'ห้องน้ำ', 745, 510), ('users', 'สมาชิกในบ้าน', 700, 630)]
R = 50
LABELS = []  # วาดด้วย PIL (cairosvg หาฟอนต์ไทยไม่เจอ)

def bubble(icon, label, x, y):
    s = R * 1.05 / 24
    ay = max(ty + 70, min(base - 50, y))
    LABELS.append((label, x + R + 24, y))
    return f'''
    <path d="M{tx + tank.width - 6},{ay} C{tx + tank.width + 60},{ay} {x - R - 60},{y} {x - R - 4},{y}" fill="none" stroke="#2aa7d6" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round" opacity=".8"/>
    <g filter="url(#sh)"><circle cx="{x}" cy="{y}" r="{R}" fill="#fff"/></g>
    <circle cx="{x}" cy="{y}" r="{R - 7}" fill="url(#ig)"/>
    <g transform="translate({x - 12 * s},{y - 12 * s}) scale({s})" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="{ICONS[icon]}"/></g>'''

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff1fb"/><stop offset=".72" stop-color="#f6fbfe"/><stop offset="1" stop-color="#e3eef6"/></linearGradient>
    <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1596c7"/><stop offset="1" stop-color="#1b3a66"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="floor"><stop offset="0" stop-color="#0f2747" stop-opacity=".35"/><stop offset="1" stop-color="#0f2747" stop-opacity="0"/></radialGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0f2747" flood-opacity=".18"/></filter>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  <circle cx="{cx_top}" cy="{ty + th * 0.45}" r="380" fill="url(#glow)"/>
  <rect y="{base - 8}" width="{W}" height="{H - base + 8}" fill="#e6eef5"/>
  <ellipse cx="{cx_top}" cy="{base + 6}" rx="{tank.width * 0.62}" ry="26" fill="url(#floor)"/>
  {''.join(bubble(*b) for b in BUBBLES)}
  <image x="{tx}" y="{ty}" width="{tank.width}" height="{th}" xlink:href="data:image/png;base64,{tank_b64}"/>
</svg>'''
png = cairosvg.svg2png(bytestring=svg.encode(), output_width=W, output_height=H)
from PIL import ImageDraw, ImageFont
img = Image.open(io.BytesIO(png)).convert('RGB')
d = ImageDraw.Draw(img)
font = ImageFont.truetype(FONT, 30)
for label, x, y in LABELS:
    w = d.textlength(label, font=font)
    d.rounded_rectangle((x, y - 26, x + w + 44, y + 26), radius=26, fill=(15, 39, 71))
    d.text((x + 22, y + 1), label, font=font, fill='white', anchor='lm')
img.save('public/images/articles/water-tank-size-guide-v2.jpg', quality=86, optimize=True)
print('✓ water-tank-size-guide.jpg')

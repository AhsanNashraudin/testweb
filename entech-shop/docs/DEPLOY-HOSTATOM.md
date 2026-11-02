# อัปเว็บ ENTECH ขึ้น Hostatom (Plesk → Node.js)

เว็บนี้เป็น **Next.js (Node.js)** ไม่ใช่ PHP/WordPress — ใช้ฟีเจอร์ **Node.js ใน Plesk** ของ Hostatom
ไฟล์ที่ต้องอัปมีไฟล์เดียว: **`entech-hostatom.zip`** (~29 MB รวมทุกอย่างที่ต้องใช้รันแล้ว ไม่ต้องกด npm install)

## 0. ก่อนเริ่ม (ถาม/เช็กกับ Hostatom)
- แพ็กเกจ Web Hosting ที่ซื้อ **เปิดใช้ Node.js ใน Plesk ได้** และมีเวอร์ชัน **Node.js 20 หรือ 22** (หน้าแพ็กเกจระบุว่ารองรับ Node.js)
- แจ้งว่าเป็นแอป Next.js ใช้ RAM ขณะรันประมาณ 200–400 MB — ถ้าแพ็กเกจจำกัด RAM ต่ำ ให้ใช้ **Cloud VPS** แทน (ดูข้อ 8)
- ฐานข้อมูล: เก็บเป็น **ไฟล์ SQLite บนโฮสต์ Hostatom เอง** (`entech-data/entech.db` นอก httpdocs) — ย้ายข้อมูลจาก Turso ด้วยสคริปต์ในข้อ 1.5
  - ⚠️ **สร้าง Token ใหม่ใน Turso ก่อนใช้สคริปต์** (token เดิมเคยหลุดในแชท ถือว่าไม่ปลอดภัย) — token ใช้ในเครื่องคุณเท่านั้น ไม่ต้องใส่บนโฮสต์

## 1. เพิ่มโดเมนใน Plesk
Plesk → **Websites & Domains** → ใช้โดเมน `www.entechproducts.co.th` (หรือโดเมนย่อยทดสอบ เช่น `new.entechproducts.co.th` ก่อนก็ได้)

## 1.5 ย้ายข้อมูลจาก Turso → ไฟล์ entech.db (ทำในเครื่องคุณ ครั้งเดียว)
ในโฟลเดอร์โปรเจกต์ (ที่ `npm install` แล้ว) เปิด PowerShell:
```powershell
$env:TURSO_URL="libsql://ชื่อฐานข้อมูล.turso.io"
$env:TURSO_TOKEN="token ใหม่"
node scripts/export-turso.mjs
```
ได้ไฟล์ `deploy\entech.db` — สคริปต์บอกจำนวนแถวของทุกตาราง (สินค้า คำสั่งซื้อ บทความ รูปที่อัปโหลด ฯลฯ) ให้ตรวจว่าครบ
- ทำ **ตอนจะย้ายจริง** (หลังจากนั้นคำสั่งซื้อใหม่บนเว็บทดสอบ Vercel จะไม่ตามมา)

## 2. อัปโหลดไฟล์
1. Plesk → **Files** → เข้าโฟลเดอร์ `httpdocs` ของโดเมน → ลบไฟล์ตัวอย่างเดิม (index.html ฯลฯ)
2. **Upload** `entech-hostatom.zip` → คลิกขวา **Extract Files** ไว้ใน `httpdocs`
3. ตรวจว่าใน `httpdocs` มี `app.js`, `server.js`, โฟลเดอร์ `.next`, `node_modules`, `public`
4. **ฐานข้อมูล:** กลับไปโฟลเดอร์บนสุดของโดเมน (ระดับเดียวกับ `httpdocs`) → **สร้างโฟลเดอร์ `entech-data`** → อัป `entech.db` เข้าไป
   ```
   (โฟลเดอร์ของโดเมน)
   ├── httpdocs/        ← ตัวเว็บ (แตก zip ที่นี่)
   └── entech-data/     ← entech.db (ข้อมูลทั้งหมด — ห้ามลบ ห้ามอัปทับหลังเปิดเว็บแล้ว)
   ```
   อยู่นอก httpdocs = คนนอกดาวน์โหลดไฟล์ไม่ได้ และอัปเว็บเวอร์ชันใหม่ทับแล้วข้อมูลไม่หาย

## 3. เปิด Node.js
Websites & Domains → โดเมน → **Node.js** แล้วตั้งค่า:

| ช่อง | ค่า |
|---|---|
| Node.js Version | **22.x** (หรือ 20.x) |
| Package Manager | npm (**ไม่ต้องกด NPM install** — มี node_modules มาแล้ว) |
| Application Mode | production |
| Application Root | `/httpdocs` |
| Document Root | `/httpdocs/public` |
| Application Startup File | `app.js` |

## 4. ตั้งค่า Environment Variables (ปุ่ม Custom environment variables)

| ชื่อ | ค่า | หมายเหตุ |
|---|---|---|
| `NODE_ENV` | `production` | |
| `SITE_URL` | `https://www.entechproducts.co.th` | ใช้ใน sitemap / Google / ลิงก์แชร์ |
| `DATABASE_URL` | `file:../entech-data/entech.db` | ไฟล์ฐานข้อมูลบนโฮสต์ (นับจาก httpdocs) |
| `SESSION_SECRET` | สุ่ม 64 ตัวอักษร | ใช้ค่าเดียวกับ Vercel ได้ (แอดมินไม่ต้องล็อกอินใหม่) |
| `STOCK_API_KEY` | (ถ้าเชื่อมระบบสต็อก) | ดู docs/STOCK-API.md · เว้นว่าง = ปิด API |
| `LINE_CHANNEL_TOKEN` | Channel access token (long-lived) | แจ้งเตือนฟอร์ม/คำสั่งซื้อเข้า LINE ทีมขาย — ดูข้อ 6.6 · เว้นว่าง = ไม่ส่ง LINE |
| `LINE_CHANNEL_SECRET` | Channel secret | ใช้ตรวจลายเซ็น webhook (หา LINE ID ของกลุ่ม) |
| `CRON_KEY` | สุ่ม 32+ ตัวอักษร (วิธีเดียวกับ SESSION_SECRET) | ใช้กับ Scheduled Task ข้อ 6.6 |

สุ่ม SESSION_SECRET: เปิด PowerShell พิมพ์ `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

จากนั้นกด **Enable Node.js** → **Restart App** → เปิดเว็บทดสอบ

## 5. SSL + ชี้โดเมน
1. Plesk → **SSL/TLS Certificates** → **Let's Encrypt** (ติ๊ก www ด้วย) → เปิด **Permanent SEO-safe 301 redirect from HTTP to HTTPS**
2. ตั้ง **Preferred domain** = `www.entechproducts.co.th` (ไม่มี www → เด้งไป www)
3. ชี้โดเมน `entechproducts.co.th` มาที่ Hostatom (เปลี่ยน Name Server หรือแก้ A record ทั้ง `@` และ `www` ตามที่ Hostatom ให้) — โดเมน .co.th จัดการผ่านผู้รับจดโดเมน/THNIC
   - ⚠️ ถ้าใช้อีเมล @entechproducts.co.th อยู่ ให้คัดลอก **MX record** เดิมมาด้วย ไม่งั้นอีเมลจะเข้าไม่ได้
4. **โดเมนเก่า `entech-products.com` (ReadyPlanet)**: ถ้ายังต่ออายุอยู่ ให้เพิ่มเป็น **Domain Alias / Redirect 301** ใน Plesk ไปที่ `https://www.entechproducts.co.th` — ลิงก์หน้าเดิม (เช่น `/16507193/...`) จะเด้งไปหน้าสินค้าใหม่ อันดับ Google โอนมาโดเมนใหม่

## 6. เช็กหลังขึ้นเว็บ
- [ ] หน้าแรก / หน้าสินค้า / ตะกร้า / สั่งซื้อทดสอบ 1 รายการ (แล้วยกเลิกในหลังบ้าน)
- [ ] `/admin` ล็อกอินได้ · อัปโหลดรูปในหลังบ้านได้
- [ ] `https://www.entechproducts.co.th/sitemap.xml` เปิดได้ → ส่งใน Google Search Console
- [ ] เปิดจากมือถือ
- [ ] หลังบ้าน → **สำรองข้อมูล** → ข้อ 1 "สำรองอัตโนมัติ ล่าสุด" มีวันเวลา (ภายใน 1 ชม. หลังเปิดเว็บ) · ดาวน์โหลดชุดสำรองครบได้

## 6.5 สำรองข้อมูล & ความปลอดภัยไฟล์ข้อมูล (ทำงานอัตโนมัติ)
**ระบบในเว็บ (หลังบ้าน → สำรองข้อมูล)** แบ่ง 4 ส่วน:
1. **สำรองทั้งระบบ** — สำรองอัตโนมัติทุกวัน (เก็บ 14 วัน) + ปุ่ม "สำรองตอนนี้" + ดาวน์โหลด "ชุดสำรองครบ (ZIP)" = ฐานข้อมูล + ไฟล์ Excel + รูปที่อัปโหลด
2. **ส่งออกแยกส่วน** — สินค้า/ราคา/สต็อก · คำสั่งซื้อ · รายการสินค้าในคำสั่งซื้อ · ใบเสนอราคา · บทความ & CSR (CSV เปิด Excel ได้) · ตั้งค่าเว็บ (JSON) · รูปที่อัปโหลด (ZIP)
3. **ไฟล์สำรองบนเซิร์ฟเวอร์** — ดาวน์โหลด/กู้คืนย้อนหลังตามวันเวลา (ก่อนกู้คืน ระบบสำรองข้อมูลปัจจุบันให้ก่อนเสมอ → ย้อนกลับได้)
4. **กู้คืนจากไฟล์ในเครื่อง** — อัปโหลดไฟล์ .db ที่เคยดาวน์โหลดไว้

**ความปลอดภัยไฟล์ข้อมูล (ตั้งให้อัตโนมัติตอนเปิดเว็บ):**
- ฐานข้อมูลและไฟล์สำรองอยู่ใน `entech-data/` **นอก httpdocs** → เปิดผ่านเว็บไม่ได้ (ถ้าตั้งผิดไปไว้ใน public ระบบจะไม่ยอมสำรอง และแจ้งเตือนใน log)
- สิทธิ์ไฟล์ **600** / โฟลเดอร์ **700** = เจ้าของบัญชีโฮสต์อ่านได้คนเดียว
- ดาวน์โหลด/กู้คืน ทำได้เฉพาะแอดมินที่ล็อกอิน · ไฟล์ไม่ถูก cache · ชื่อไฟล์ถูกตรวจ (อ่านไฟล์อื่นนอกโฟลเดอร์สำรองไม่ได้)
- ไฟล์สำรองมีข้อมูลลูกค้า → เก็บใน Google Drive ของบริษัท (ไม่แชร์ลิงก์สาธารณะ)

**สำรองชั้นที่ 2 (นอกเว็บ):** Plesk → **Backup Manager** → **Scheduled backup** รายวัน เก็บ 7–14 วัน (รวมโฟลเดอร์ `entech-data`)
**ชั้นที่ 3:** แอดมินกด "ดาวน์โหลดชุดสำรองครบ (ZIP)" สัปดาห์ละครั้ง → เก็บใน Google Drive บริษัท

## 6.6 แจ้งเตือน LINE ทีมขาย + งานตามเวลา
1. ตั้ง LINE: ทำตามขั้นตอนในหลังบ้าน → **ทีมขาย & แจ้งเตือน** (สร้าง Messaging API · ใส่ `LINE_CHANNEL_TOKEN`/`LINE_CHANNEL_SECRET` · Webhook = `https://www.entechproducts.co.th/api/line/webhook`)
2. เพิ่มบอทเข้ากลุ่ม LINE ฝ่ายขาย → บอทตอบ LINE ID ของกลุ่ม → วางในหลังบ้าน แล้วกด "ส่งข้อความทดสอบ"
3. **Plesk → Scheduled Tasks → Add Task → Fetch a URL** ทุก 15 นาที:
   `https://www.entechproducts.co.th/api/cron?key=<CRON_KEY>`
   (Plesk พักแอป Node เมื่อไม่มีคนเข้า — งานนี้ทำให้การเตือนฟอร์มค้างและสำรองรายวันทำงานตรงเวลาเสมอ)

## 7. อัปเดตเวอร์ชันใหม่ครั้งถัดไป
1. ขอไฟล์ zip ใหม่ (ผม build ให้) — **ต้อง build บน Linux/WSL เท่านั้น** (`npm run build:hostatom`) เพราะไลบรารีฐานข้อมูลและย่อรูปต้องเป็นของ Linux; build บน Windows แล้วอัปจะใช้ไม่ได้
2. คอลัมน์ใหม่ในฐานข้อมูล ระบบเพิ่มให้เองตอน Restart (ไม่ต้องทำอะไร) · ถ้ารุ่นนั้นเปลี่ยนโครงสร้างแบบอื่น (ผมจะแจ้งทุกครั้ง): ดาวน์โหลดสำรองข้อมูลจากหลังบ้าน → ส่งต่อให้ผมปรับโครงสร้าง (หรือรัน `DATABASE_URL=file:ไฟล์.db npm run db:push && npm run db:seed` บน Linux/WSL) → อัปกลับช่วงเว็บเงียบ
   **ห้ามอัป `entech.db` ทับตอนเว็บเปิดใช้งานแล้ว** ถ้าไม่ได้ดาวน์โหลดล่าสุดมาก่อน — คำสั่งซื้อที่เข้ามาระหว่างนั้นจะหาย
3. Plesk → Files → อัป zip ทับใน `httpdocs` → Extract (เลือก Replace) → Node.js → **Restart App**

## 8. ถ้า Web Hosting ไม่ไหว → Cloud VPS
Cloud VPS (เริ่ม ~290 บาท/เดือน, RAM 2 GB ขึ้นไป) ติดตั้ง Node.js 22 + PM2 แล้วรัน:
```bash
cd /var/www/entech && unzip -o entech-hostatom.zip
mkdir -p /var/www/entech-data   # อัป entech.db ไว้ที่นี่
PORT=3000 DATABASE_URL=file:/var/www/entech-data/entech.db SITE_URL=https://www.entechproducts.co.th SESSION_SECRET=... pm2 start app.js --name entech && pm2 save
```
แล้วตั้ง Nginx reverse proxy โดเมน → `127.0.0.1:3000` + SSL (certbot)

## หมายเหตุ: เว็บทดสอบบน Vercel
หลังเปิดเว็บจริง ตั้ง `NOINDEX=1` ใน Environment Variables ของ Vercel แล้ว Redeploy → Google จะไม่เก็บเว็บทดสอบ (กันเนื้อหาซ้ำกับเว็บจริง)
หลังย้าย เว็บจริง (Hostatom) กับเว็บทดสอบ (Vercel/Turso) ใช้ข้อมูลคนละชุด — แก้สินค้า/ราคาในหลังบ้าน **ของเว็บจริง** เท่านั้น

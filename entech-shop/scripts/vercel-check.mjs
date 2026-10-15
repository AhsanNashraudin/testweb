// ตรวจก่อน build บน Vercel และบอกชัด ๆ ว่าขาดอะไร (แสดงเฉพาะชื่อตัวแปร ไม่แสดงค่า)
const names = Object.keys(process.env).filter((k) => /DATABASE|TURSO|SESSION_SECRET|ADMIN_|SITE_URL/.test(k));
console.log('ตัวแปรที่พบ:', names.sort().join(', ') || '(ไม่มี)');
const url = process.env.DATABASE_URL || Object.entries(process.env).find(([k, v]) => k.endsWith('TURSO_DATABASE_URL') && v)?.[1] || '';
const errs = [];
if (!/^(libsql|https|wss?):\/\//.test(url))
  errs.push('ยังไม่ได้เชื่อมฐานข้อมูล Turso — Vercel > โปรเจกต์ > Storage > Turso > Connect (ติ๊ก Production) แล้ว Redeploy');
if ((process.env.SESSION_SECRET || '').trim().length < 32)
  errs.push('ยังไม่ได้ตั้ง SESSION_SECRET (สุ่ม 32 ตัวอักษรขึ้นไป) — Settings > Environment Variables');
if ((process.env.ADMIN_PASSWORD || '').trim().length < 8)
  errs.push('ยังไม่ได้ตั้ง ADMIN_PASSWORD (8 ตัวอักษรขึ้นไป) — Settings > Environment Variables');
if (errs.length) { errs.forEach((e) => console.error('✗ ' + e)); process.exit(1); }
console.log('✓ พร้อม build');

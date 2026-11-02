/** (เฉพาะ Node.js) อัปเดตโครงสร้างฐานข้อมูล + เตือนฟอร์มค้าง + ล็อกสิทธิ์ไฟล์ฐานข้อมูล + สำรองข้อมูลอัตโนมัติวันละครั้ง — ใช้กับฐานข้อมูลแบบไฟล์บนโฮสต์ */
import * as b from '@/lib/backup';
import { checkReminders } from '@/lib/notify';

if (b.isFileDb()) {
  const { ensureSchema } = await import('@/db/ensure');
  await ensureSchema().catch((e) => console.error('✗ อัปเดตโครงสร้างฐานข้อมูล:', e));
}
// เตือนฟอร์มที่ยังไม่มีคนติดต่อกลับ (ตรวจทุก 10 นาที) — โฮสต์ที่พักแอปเมื่อไม่มีคนเข้า ให้ตั้ง cron เรียก /api/cron เพิ่ม
setInterval(() => checkReminders().catch((e) => console.error('✗ เตือนฟอร์มค้าง:', e)), 600_000).unref?.();

if (process.env.BACKUP_AUTO !== '0' && b.isFileDb()) {
  try {
    b.assertPrivateLocation();
    await b.lockDown();
    const tick = () => b.autoBackupIfDue().then((r) => r && console.log(`✓ สำรองข้อมูลอัตโนมัติ: ${r.name}`)).catch((e) => console.error('✗ สำรองอัตโนมัติไม่สำเร็จ:', e));
    setTimeout(tick, Number(process.env.BACKUP_FIRST_DELAY_MS) || 60_000).unref?.(); // รอเว็บเปิดเสร็จก่อน
    setInterval(tick, 3600_000).unref?.(); // เช็กทุกชั่วโมง ถ้าวันนี้ยังไม่ได้สำรองจึงสร้าง
  } catch (e) {
    console.error('⚠', (e as Error).message);
  }
}

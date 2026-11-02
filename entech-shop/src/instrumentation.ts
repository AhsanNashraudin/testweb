/** เริ่มทำงานตอนเปิดเซิร์ฟเวอร์ — ส่วนที่ใช้ระบบไฟล์แยกไว้ใน instrumentation-node.ts (Edge runtime ใช้ไม่ได้) */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./instrumentation-node');
}

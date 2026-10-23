'use client';
import Link from 'next/link';
/** ข้อผิดพลาดที่ไม่คาดคิด: แสดงภาษาไทย ไม่แสดงรายละเอียดภายใน (ดูใน log ด้วยรหัสอ้างอิง) */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return (
    <div className="card flex min-h-[40vh] flex-col items-center justify-center gap-4 p-10 text-center" role="alert">
      <h1 className="text-xl font-bold text-navy-900">{offline ? 'ไม่มีสัญญาณอินเทอร์เน็ต' : 'หน้านี้โหลดไม่สำเร็จ'}</h1>
      <p className="max-w-md text-sm text-muted">{offline ? 'ตรวจ Wi-Fi หรือเน็ตมือถือ แล้วกด "ลองใหม่"' : 'ลองใหม่อีกครั้ง ถ้ายังไม่ได้ ให้แจ้งผู้ดูแลระบบพร้อมรหัสอ้างอิงด้านล่าง'}</p>
      {error.digest && <p className="text-xs text-muted">รหัสอ้างอิง {error.digest}</p>}
      <div className="flex flex-wrap justify-center gap-2"><button className="btn-primary" onClick={reset}>ลองใหม่</button><Link href="/" className="btn-outline">กลับแดชบอร์ด</Link></div>
    </div>
  );
}

'use client';
/** ข้อผิดพลาดระดับ root (layout พัง) — ภาษาไทย ไม่แสดงรายละเอียดภายใน */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="th"><body style={{ fontFamily: 'sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0, background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <h1 style={{ color: '#16304f' }}>ระบบขัดข้องชั่วคราว</h1>
        <p>ลองใหม่อีกครั้ง ถ้ายังไม่ได้ให้แจ้งผู้ดูแลระบบ{error.digest ? ` (รหัสอ้างอิง ${error.digest})` : ''}</p>
        <button onClick={reset} style={{ minHeight: 44, padding: '0 20px' }}>ลองใหม่</button>
      </div>
    </body></html>
  );
}

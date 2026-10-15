'use client';
/** ใช้เมื่อ root layout พังทั้งหน้า — ต้องมี <html>/<body> เอง */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="th">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0, textAlign: 'center', padding: 16 }}>
        <div>
          <h1 style={{ color: '#16304f' }}>ขออภัย ระบบขัดข้องชั่วคราว</h1>
          <p>กรุณาลองใหม่อีกครั้ง หรือติดต่อ LINE @entechproducts · โทร 063-206-1000</p>
          <button onClick={reset} style={{ padding: '12px 20px', background: '#254b7c', color: '#fff', border: 0, borderRadius: 8, fontSize: 16 }}>ลองใหม่</button>
        </div>
      </body>
    </html>
  );
}

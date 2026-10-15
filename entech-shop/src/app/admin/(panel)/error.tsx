'use client';
import Link from 'next/link';

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center" role="alert">
      <h1 className="text-2xl font-bold text-navy-900">ขออภัย เกิดข้อผิดพลาดชั่วคราว</h1>
      <p className="max-w-md text-muted">ข้อมูลในตะกร้าของคุณยังอยู่ ลองโหลดใหม่อีกครั้ง หากยังไม่ได้ ติดต่อเราทาง LINE @entechproducts หรือโทร 063-206-1000</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn-primary" onClick={reset}>ลองใหม่</button>
        <Link href="/" className="btn-outline">กลับหน้าแรก</Link>
      </div>
    </div>
  );
}

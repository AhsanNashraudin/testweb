import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="card p-10 text-center">
      <h1 className="text-xl font-bold text-navy-900">ไม่พบข้อมูลที่ต้องการ</h1>
      <p className="mt-2 text-sm text-muted">เลขเอกสารนี้อาจพิมพ์ผิด หรือถูกลบไปแล้ว</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-primary">กลับแดชบอร์ด</Link>
        <Link href="/orders" className="btn-outline">คำสั่งซื้อ</Link><Link href="/quotes" className="btn-outline">ใบเสนอราคา</Link><Link href="/inventory" className="btn-outline">คลังสินค้า</Link>
      </div>
    </div>
  );
}

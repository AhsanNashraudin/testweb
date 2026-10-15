import Link from 'next/link';
export default function NotFound() {
  return <div className="card p-10 text-center"><h1 className="text-xl font-bold">ไม่พบข้อมูลที่ต้องการ</h1><Link href="/admin" className="btn-primary mt-4">กลับภาพรวม</Link></div>;
}

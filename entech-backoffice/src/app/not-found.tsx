import Link from 'next/link';
export const metadata = { title: 'ไม่พบหน้านี้' };
/** 404 นอกเมนูหลัก (พิมพ์ URL ผิด / ลิงก์เก่า) */
export default function RootNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="card max-w-md p-10 text-center">
        <p className="text-sm font-semibold text-muted">404</p>
        <h1 className="mt-1 text-xl font-bold text-navy-900">ไม่พบหน้านี้</h1>
        <p className="mt-2 text-sm text-muted">ลิงก์อาจพิมพ์ผิดหรือเป็นลิงก์เก่า</p>
        <Link href="/" className="btn-primary mt-5">ไปแดชบอร์ด</Link>
      </div>
    </main>
  );
}

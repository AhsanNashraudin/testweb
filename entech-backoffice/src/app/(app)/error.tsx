'use client';
export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card flex min-h-[40vh] flex-col items-center justify-center gap-4 p-10 text-center" role="alert">
      <h1 className="text-xl font-bold text-navy-900">เกิดข้อผิดพลาด</h1>
      <p className="max-w-md text-sm text-muted">{error.message || 'ลองโหลดใหม่อีกครั้ง'}</p>
      <button className="btn-primary" onClick={reset}>ลองใหม่</button>
    </div>
  );
}

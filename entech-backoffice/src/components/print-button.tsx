'use client';
export function PrintButton({ label = 'พิมพ์ / บันทึก PDF' }: { label?: string }) {
  return <button type="button" onClick={() => window.print()} className="btn-outline">{label}</button>;
}

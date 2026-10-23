'use client';
export function PrintButton({ label = 'พิมพ์ / บันทึก PDF', disabled = false }: { label?: string; disabled?: boolean }) {
  return <button type="button" onClick={() => window.print()} disabled={disabled} className="btn-outline">{label}</button>;
}

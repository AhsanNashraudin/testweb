'use client';
import { useId, useRef, useState } from 'react';
import { uploadMedia } from '@/app/admin/(panel)/actions';

/** ย่อรูปในเบราว์เซอร์ก่อนอัปโหลด (กว้างไม่เกิน max px) → ไฟล์เล็ก โหลดเร็ว ไม่ต้องเตรียมรูปเอง */
async function shrink(file: File, max: number): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.85));
  const out = blob?.type === 'image/webp' ? blob : await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  if (!out) throw new Error('อ่านไฟล์รูปไม่ได้');
  return new File([out], 'image', { type: out.type });
}

/** เลือก/ลากรูปมาวาง → แสดงตัวอย่างทันที → ได้ URL ไปบันทึกพร้อมฟอร์ม (name = ชื่อช่องที่ส่งไปกับฟอร์ม) */
export function ImagePicker({ name, value, onChange, label = 'รูปภาพ', hint, max = 1600, aspect = 'aspect-[4/3]' }: {
  name?: string; value: string; onChange?: (url: string) => void; label?: string; hint?: string; max?: number; aspect?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const current = onChange ? value : url;

  async function pick(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setErr('กรุณาเลือกไฟล์รูปภาพ');
    setErr(''); setBusy(true);
    try {
      const fd = new FormData();
      fd.set('file', await shrink(file, max));
      const r = await uploadMedia(fd);
      if (r.err || !r.url) throw new Error(r.err);
      setUrl(r.url); onChange?.(r.url);
    } catch (e) {
      setErr((e as Error).message || 'อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div>
      <p className="label" id={`${id}-l`}>{label}</p>
      {name && <input type="hidden" name={name} value={current} />}
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
        className={`relative ${aspect} overflow-hidden rounded-xl border-2 border-dashed bg-slate-50 ${over ? 'border-cyan-600 bg-cyan-50' : 'border-slate-300'}`}>
        {current
          // eslint-disable-next-line @next/next/no-img-element -- ตัวอย่างในหลังบ้าน แสดงรูปที่เพิ่งอัปโหลดทันที
          ? <img src={current} alt="" className="h-full w-full object-contain" />
          : <span className="absolute inset-0 grid place-items-center text-sm text-muted">ยังไม่มีรูป</span>}
        {busy && <span className="absolute inset-0 grid place-items-center bg-white/80 text-sm font-semibold text-navy-700" role="status">กำลังอัปโหลด…</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-outline min-h-10 px-4 py-1.5" aria-describedby={`${id}-l`} data-testid={name ? `pick-${name}` : undefined}>
          {current ? 'เปลี่ยนรูป' : 'เลือกรูป'}
        </button>
        <span className="text-xs text-muted">{hint ?? 'หรือลากไฟล์มาวางในกรอบ · JPG / PNG / WebP · ระบบย่อขนาดให้อัตโนมัติ'}</span>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label={label}
          onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}

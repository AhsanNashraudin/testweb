'use client';
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type ActionResult = { ok?: string; err?: string; field?: string; t?: number } | null;
type Action = (prev: ActionResult, form: FormData) => Promise<ActionResult>;
const Pending = createContext(false);
const OK_EVENT = 'bo:action-ok';
const NET_ERR = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ข้อมูลที่กรอกยังอยู่ ตรวจสัญญาณเน็ตแล้วกดบันทึกอีกครั้ง';

/** ฟอร์มหลังบ้าน: ส่งแบบไม่รีเฟรช, ค่าที่กรอกไม่หายเมื่อผิดพลาด (รวมเน็ตหลุด), แสดงผลลัพธ์ใกล้ฟอร์ม, กันกดซ้ำ
 *  - ผลผิดพลาดที่ระบุช่อง (field) → ช่องนั้นขึ้นกรอบแดง + โฟกัส + ผูกข้อความด้วย aria-describedby
 *  - resetOnSuccess: true = ล้างทั้งฟอร์ม · string[] = ล้างทั้งฟอร์มแต่คงค่าช่องที่ระบุ (เช่น สินค้าที่เลือก)
 *  - confirm: ถามยืนยันก่อนส่งเมื่อช่อง field มีค่า value (เช่น เปลี่ยนสถานะเป็น "ยกเลิก") */
export function ActionForm({ action, children, className, resetOnSuccess, onSuccess, confirm: ask, ...rest }: {
  action: Action; children: React.ReactNode; className?: string; resetOnSuccess?: boolean | string[]; onSuccess?: () => void;
  confirm?: { field: string; value: string; message: string };
} & Omit<React.ComponentProps<'form'>, 'action' | 'onSubmit'>) {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [hidden, setHidden] = useState(0); // เวลาที่ซ่อนข้อความ (ข้อความที่เก่ากว่านี้ไม่แสดง)
  const [slow, setSlow] = useState(false);
  const [state, run, pending] = useActionState<ActionResult, FormData>(async (prev, fd) => {
    let r: ActionResult;
    try { r = await action(prev, fd); } catch { r = { err: NET_ERR }; router.refresh(); }
    if (r?.ok) {
      const f = ref.current;
      if (f && resetOnSuccess) {
        const keep = Array.isArray(resetOnSuccess) ? resetOnSuccess.map((n) => [n, (f.elements.namedItem(n) as HTMLInputElement | null)?.value] as const) : [];
        f.reset();
        for (const [n, v] of keep) { const el = f.elements.namedItem(n) as HTMLInputElement | null; if (el && v !== undefined) el.value = v; }
      }
      onSuccess?.();
      window.dispatchEvent(new CustomEvent(OK_EVENT, { detail: f }));
    }
    return r && { ...r, t: Date.now() };
  }, null);

  // ฟอร์มอื่นบันทึกสำเร็จ → ข้อความผิดพลาดเก่าของฟอร์มนี้อาจไม่จริงแล้ว (เช่น "ยังไม่ได้รับชำระเงิน") จึงซ่อน
  useEffect(() => {
    const h = (e: Event) => { if ((e as CustomEvent).detail !== ref.current) setHidden(Date.now()); };
    window.addEventListener(OK_EVENT, h);
    return () => window.removeEventListener(OK_EVENT, h);
  }, []);
  // รอนานผิดปกติ → บอกให้ตรวจผลก่อนกดซ้ำ (กันบันทึกซ้ำ)
  useEffect(() => {
    if (!pending) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 15_000);
    return () => clearTimeout(t);
  }, [pending]);

  const errId = useRef(`err-${Math.random().toString(36).slice(2)}`).current;
  const show = state && (state.t ?? 0) > hidden ? state : null;
  // ชี้ช่องที่ผิด
  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    f.querySelectorAll('[aria-invalid="true"]').forEach((el) => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
    if (!show?.err || !show.field) return;
    const el = f.elements.namedItem(show.field) as HTMLElement | null;
    if (el && 'focus' in el) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', errId); el.focus(); }
  }, [show, errId]);

  return (
    <form ref={ref} {...rest} className={className} aria-busy={pending}
      onInput={(e) => { if (show?.err && (e.target as HTMLElement).getAttribute('aria-invalid')) setHidden(Date.now()); }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        if (ask && fd.get(ask.field) === ask.value && !window.confirm(ask.message)) return;
        startTransition(() => run(fd));
      }}>
      <Pending.Provider value={pending}>{children}</Pending.Provider>
      {slow && <p role="status" className="col-span-full rounded-lg bg-warning-50 p-3 text-sm text-warning">ใช้เวลานานกว่าปกติ… ถ้าหน้าค้าง ให้รีโหลดแล้วตรวจผลในประวัติก่อนกดซ้ำ</p>}
      {show?.err && <p key={show.t} id={errId} role="alert" data-testid="flash-err" className="col-span-full rounded-lg bg-danger-50 p-3 text-sm text-sale">{show.err}</p>}
      {show?.ok && !pending && <p key={show.t} role="status" data-testid="flash-ok" className="col-span-full rounded-lg bg-success-50 p-3 text-sm text-success">✓ {show.ok}</p>}
    </form>
  );
}

/** ปุ่ม submit ที่รู้สถานะ "กำลังบันทึก" ของ ActionForm */
export function SubmitButton({ children, pendingText = 'กำลังบันทึก…', className = 'btn-primary', confirm: ask, ...rest }: React.ComponentProps<'button'> & { pendingText?: string; confirm?: string }) {
  const pending = useContext(Pending);
  return (
    <button {...rest} className={className} disabled={pending || rest.disabled} onClick={ask ? (e) => { if (!window.confirm(ask)) e.preventDefault(); } : undefined}>
      {pending ? pendingText : children}
    </button>
  );
}

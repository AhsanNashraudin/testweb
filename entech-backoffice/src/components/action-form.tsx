'use client';
import { createContext, startTransition, useActionState, useContext, useRef } from 'react';

export type ActionResult = { ok?: string; err?: string; t?: number } | null;
type Action = (prev: ActionResult, form: FormData) => Promise<ActionResult>;
const Pending = createContext(false);

/** ฟอร์มหลังบ้าน: ส่งแบบไม่รีเฟรช, ค่าที่กรอกไม่หายเมื่อผิดพลาด, แสดงผลลัพธ์ใกล้ฟอร์ม, กันกดซ้ำ
 *  confirm: ถามยืนยันก่อนส่งเมื่อช่อง field มีค่า value (เช่น เปลี่ยนสถานะเป็น "ยกเลิก") */
export function ActionForm({ action, children, className, resetOnSuccess, onSuccess, confirm: ask, ...rest }: {
  action: Action; children: React.ReactNode; className?: string; resetOnSuccess?: boolean; onSuccess?: () => void;
  confirm?: { field: string; value: string; message: string };
} & Omit<React.ComponentProps<'form'>, 'action' | 'onSubmit'>) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, run, pending] = useActionState<ActionResult, FormData>(async (prev, fd) => {
    const r = await action(prev, fd);
    if (r?.ok && resetOnSuccess) ref.current?.reset();
    if (r?.ok) onSuccess?.();
    return r && { ...r, t: Date.now() };
  }, null);
  return (
    <form ref={ref} {...rest} className={className} aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        if (ask && fd.get(ask.field) === ask.value && !window.confirm(ask.message)) return;
        startTransition(() => run(fd));
      }}>
      <Pending.Provider value={pending}>{children}</Pending.Provider>
      {state?.err && <p key={state.t} role="alert" data-testid="flash-err" className="col-span-full rounded-lg bg-danger-50 p-3 text-sm text-sale">{state.err}</p>}
      {state?.ok && !pending && <p key={state.t} role="status" data-testid="flash-ok" className="col-span-full rounded-lg bg-success-50 p-3 text-sm text-success">✓ {state.ok}</p>}
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

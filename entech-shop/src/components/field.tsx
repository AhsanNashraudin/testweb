'use client';
import { cloneElement, isValidElement } from 'react';

/** label + ช่องกรอก + ข้อความผิดพลาดใต้ช่อง (ผูก aria-invalid / aria-describedby ให้อัตโนมัติ) */
export function Field({ id, label, err, hint, className, children }: { id: string; label: string; err?: string; hint?: string; className?: string; children: React.ReactElement<Record<string, unknown>> }) {
  const desc = err ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      {isValidElement(children) ? cloneElement(children, { id, 'aria-invalid': err ? true : undefined, 'aria-describedby': desc }) : children}
      {err ? <p id={`${id}-err`} className="err" data-testid={`err-${id}`}>{err}</p> : hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** เลื่อนหน้าและวาง focus ที่ช่องแรกที่ผิด (ตามลำดับในฟอร์ม) */
export function focusFirstError(form: HTMLFormElement | null) {
  {
    const el = form?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form?.querySelector<HTMLElement>('[role="alert"]');
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (el.matches('input,select,textarea')) el.focus({ preventScroll: true });
  }
}

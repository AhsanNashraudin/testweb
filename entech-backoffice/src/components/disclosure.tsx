'use client';
import { useEffect, useRef } from 'react';

/** <details> ที่ปิดได้ด้วย Esc (คืนโฟกัสให้หัวข้อ) และโฟกัสช่องแรกเมื่อเปิด · เปิดจากลิงก์ #id ได้ */
export function Disclosure({ id, summary, defaultOpen, className, children }: { id?: string; summary: React.ReactNode; defaultOpen?: boolean; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const focusFirst = () => d.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea')?.focus();
    if (defaultOpen) focusFirst();
    const hash = () => { if (id && location.hash === `#${id}`) { d.open = true; focusFirst(); } };
    hash();
    window.addEventListener('hashchange', hash);
    return () => window.removeEventListener('hashchange', hash);
  }, [id, defaultOpen]);
  return (
    <details ref={ref} id={id} open={defaultOpen} className={className}
      onToggle={(e) => { if (e.currentTarget.open) e.currentTarget.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea')?.focus(); }}
      onKeyDown={(e) => { if (e.key === 'Escape' && ref.current?.open) { ref.current.open = false; ref.current.querySelector('summary')?.focus(); } }}>
      {summary}
      {children}
    </details>
  );
}

'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

/** แถบความคืบหน้าด้านบนเมื่อกดลิงก์ภายในเว็บ (แทน loading.tsx ซึ่งจะทำให้หน้า 404 ตอบ 200) */
function Bar() {
  const path = usePathname(), sp = useSearchParams();
  const [on, setOn] = useState(false);
  useEffect(() => setOn(false), [path, sp]);
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      setOn(true);
    };
    const submit = (e: SubmitEvent) => { if ((e.target as HTMLFormElement).method === 'get' && !e.defaultPrevented) setOn(true); };
    document.addEventListener('click', click);
    document.addEventListener('submit', submit);
    return () => { document.removeEventListener('click', click); document.removeEventListener('submit', submit); };
  }, []);
  if (!on) return null;
  return (
    <div role="progressbar" aria-label="กำลังโหลดหน้า" className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-cyan-100">
      <div className="h-full w-1/3 animate-[navbar_1s_ease-in-out_infinite] bg-cyan-600" />
    </div>
  );
}
export function NavProgress() {
  return <Suspense fallback={null}><Bar /></Suspense>;
}

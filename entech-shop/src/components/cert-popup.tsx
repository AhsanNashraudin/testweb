'use client';
/** การ์ดใบรับรองที่กดแล้วเปิดรูปใบรับรองแบบ popup (<dialog> ปิดได้ด้วย Esc / คลิกพื้นหลัง / ปุ่มปิด) */
import { useRef } from 'react';
import Image from 'next/image';

export function CertPopup({ className, children, image, alt, w, h }: { className: string; children: React.ReactNode; image: string; alt: string; w: number; h: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={`${className} cursor-pointer text-left transition hover:-translate-y-0.5 hover:ring-cyan-600`} aria-haspopup="dialog" data-testid="cert-open">
        {children}
        <span className="ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-100 text-navy-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" /></svg>
        </span>
      </button>
      <dialog ref={ref} onClick={(e) => e.target === ref.current && ref.current?.close()} aria-label={alt} data-testid="cert-dialog"
        className="m-auto max-h-[90vh] max-w-[92vw] rounded-2xl bg-white p-4 shadow-2xl backdrop:bg-navy-900/70">
        <Image src={image} alt={alt} width={w} height={h} className="h-auto max-h-[78vh] w-auto" />
        <form method="dialog" className="mt-3 text-center"><button className="btn-outline px-6">ปิด</button></form>
      </dialog>
    </>
  );
}

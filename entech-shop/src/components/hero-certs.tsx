'use client';
/** การ์ดมาตรฐานในแบนเนอร์หน้าแรก — การ์ด มอก. กดแล้วเปิดใบอนุญาตในป๊อปอัป (dialog ของเบราว์เซอร์: กด Esc / คลิกนอกรูป เพื่อปิด) */
import Image from 'next/image';
import { useRef } from 'react';

const CARD = 'flex items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-5 text-left shadow-[0_8px_24px_-12px_rgba(15,39,71,0.35)] ring-1 ring-slate-200/80';

function Body({ src, title, desc }: { src: string; title: string; desc: string }) {
  return (
    <>
      <Image src={src} alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
      <span className="leading-tight">
        <span className="block font-bold text-navy-900">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{desc}</span>
      </span>
    </>
  );
}

export function HeroCerts({ certImage }: { certImage: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const tisi = { src: '/images/cert-tisi.png', title: 'มาตรฐาน มอก.', desc: 'สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม' };
  return (
    <>
      <ul className="grid gap-3 sm:flex sm:flex-wrap sm:items-stretch" aria-label="มาตรฐานที่ได้รับ" data-testid="hero-certs">
        <li className={CARD}><Body src="/images/cert-iso9001.jpg" title="ISO 9001" desc="ระบบบริหารคุณภาพ" /></li>
        <li className="flex">
          {certImage ? (
            <button type="button" onClick={() => dlg.current?.showModal()} data-testid="cert-open"
              className={`${CARD} group w-full cursor-zoom-in transition hover:-translate-y-0.5 hover:ring-cyan-500`}>
              <Body {...tisi} />
              <span className="ml-auto grid h-7 w-7 shrink-0 sm:ml-1 place-items-center rounded-full bg-navy-50 text-navy-700 transition group-hover:bg-cyan-100" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5M11 8.5v5M8.5 11h5" /></svg>
              </span>
              <span className="sr-only">ดูใบอนุญาต มอก.</span>
            </button>
          ) : <span className={`${CARD} w-full`}><Body {...tisi} /></span>}
        </li>
      </ul>
      {certImage && (
        <dialog ref={dlg} data-testid="cert-dialog" aria-label="ใบอนุญาตแสดงเครื่องหมายมาตรฐาน มอก."
          onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
          className="m-auto max-h-[92vh] w-[min(92vw,640px)] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-navy-900/70 backdrop:backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <p className="font-bold text-navy-900">ใบอนุญาตแสดงเครื่องหมายมาตรฐาน มอก.</p>
            <button type="button" onClick={() => dlg.current?.close()} className="grid h-10 w-10 place-items-center rounded-full text-xl hover:bg-slate-100" aria-label="ปิด">✕</button>
          </div>
          <div className="max-h-[calc(92vh-64px)] overflow-auto bg-slate-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={certImage} alt="ใบอนุญาตแสดงเครื่องหมายมาตรฐานกับผลิตภัณฑ์อุตสาหกรรม บริษัท เอนเทค โพรดักส์ จำกัด" loading="lazy" className="mx-auto h-auto w-full rounded-lg bg-white" />
          </div>
        </dialog>
      )}
    </>
  );
}

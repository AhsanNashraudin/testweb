'use client';
import { useEffect, useId, useState } from 'react';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { ImagePicker } from '@/components/image-picker';
import { saveHome } from '../actions';
import type { Home, SectionKey } from '@/lib/content';
import { Icon, ICON_LABEL, type IconName } from '@/components/icons';

const SECTION_HELP: Record<SectionKey, string> = {
  features: 'หัวข้อ (ใส่คำค้นหลักเพื่อ SEO) + คำอธิบาย + ไอคอนบริการ 6 ข้อ (แก้ได้ด้านล่าง)',
  categories: 'รูปและชื่อหมวดหมู่ทั้งหมด',
  featured: 'สินค้าที่ติ๊ก "สินค้าแนะนำหน้าแรก" ในหน้าแก้ไขสินค้า',
  why: 'กล่องข้อความจุดเด่นของบริษัท (แก้ข้อความได้ด้านล่าง)',
  articles: 'บทความความรู้ที่เผยแพร่ล่าสุด 3 เรื่อง',
  csr: 'กิจกรรม CSR ล่าสุด 3 เรื่อง (แยกจากบทความ)',
  cta: 'แถบสีน้ำเงินชวนขอใบเสนอราคา (แก้ข้อความได้ด้านล่าง)',
};
const SECTION_NAME: Record<SectionKey, string> = {
  features: 'จุดเด่นบริการ',
  categories: 'หมวดหมู่สินค้า', featured: 'สินค้าแนะนำ', why: 'จุดเด่น', articles: 'บทความล่าสุด', csr: 'กิจกรรม CSR', cta: 'แถบปิดท้าย',
};

/** สลับตำแหน่งรายการ i กับ i+d */
const move = <T,>(a: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= a.length) return a;
  const b = [...a];
  [b[i], b[j]] = [b[j], b[i]];
  return b;
};

function Text({ label, value, onChange, hint, rows, max, list, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number; max?: number; list?: string; placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {rows
        ? <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} maxLength={max} className="input" placeholder={placeholder} />
        : <input id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} list={list} className="input" placeholder={placeholder} />}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function HomeEditor({ initial, defaults, links }: { initial: Home; defaults: Home; links: [string, string][] }) {
  const [h, setH] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [preview, setPreview] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const dirty = JSON.stringify(h) !== saved;
  const hero = (patch: Partial<Home['hero']>) => setH((x) => ({ ...x, hero: { ...x.hero, ...patch } }));
  const cta = (patch: Partial<Home['cta']>) => setH((x) => ({ ...x, cta: { ...x.cta, ...patch } }));

  // เตือนก่อนออกจากหน้า ถ้ายังไม่ได้กดบันทึก
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const w = device === 'desktop' ? 1280 : 390;
  const scale = device === 'desktop' ? 0.36 : 0.8;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
      <ActionForm action={saveHome} onSuccess={() => { setSaved(JSON.stringify(h)); setPreview((n) => n + 1); }} className="min-w-0 space-y-5">
        <input type="hidden" name="config" value={JSON.stringify(h)} />
        <datalist id="page-links">{links.map(([href, label]) => <option key={href} value={href}>{label}</option>)}</datalist>

        <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 bg-slate-100/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          <div>
            <h1 className="text-2xl font-bold">จัดการหน้าแรก</h1>
            <p className="text-sm text-muted">{dirty ? <span className="font-semibold text-amber-700">● มีการแก้ไขที่ยังไม่บันทึก</span> : 'แก้ข้อความ เปลี่ยนรูป จัดลำดับ แล้วกด "บันทึก"'}</p>
          </div>
          <div className="flex gap-2">
            <a href="/" target="_blank" className="btn-outline">ดูหน้าเว็บ ↗</a>
            <SubmitButton>บันทึก</SubmitButton>
          </div>
        </div>

        {/* 1. แบนเนอร์ */}
        <section className="card grid gap-4 p-5" aria-labelledby="s-hero">
          <div>
            <h2 id="s-hero" className="text-lg font-bold">1. แบนเนอร์หลัก (ส่วนบนสุดของหน้า)</h2>
            <p className="text-sm text-muted">ส่วนแรกที่ลูกค้าเห็น — ใส่ข้อความสั้น ชัด และรูปที่สวยที่สุด</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ImagePicker label="รูปแบนเนอร์" value={h.hero.image} onChange={(image) => hero({ image })}
              hint="แนะนำรูปแนวนอน 4:3 กว้าง 1200px ขึ้นไป · ลากไฟล์มาวางได้" />
            <div className="grid content-start gap-4">
              <fieldset>
                <legend className="label">ตำแหน่งรูป</legend>
                <div className="flex gap-2">
                  {(['left', 'right'] as const).map((side) => (
                    <label key={side} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-2.5 text-sm font-semibold ${h.hero.imageSide === side ? 'border-navy-700 bg-navy-50' : 'border-slate-200'}`}>
                      <input type="radio" name="imageSide" className="sr-only" checked={h.hero.imageSide === side} onChange={() => hero({ imageSide: side })} />
                      {side === 'left' ? '🖼 รูปซ้าย · ข้อความขวา' : 'ข้อความซ้าย · รูปขวา 🖼'}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label">รูปแบบรูป</legend>
                <div className="flex gap-2">
                  {([['scene', 'ภาพฉากเต็ม (ขอบซ้ายจางกลืนพื้นหลัง)'], ['contain', 'รูปสินค้าพื้นใส'], ['cover', 'ภาพถ่ายเต็มกรอบ']] as const).map(([fit, label]) => (
                    <label key={fit} className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 p-2.5 text-center text-sm font-semibold ${h.hero.imageFit === fit ? 'border-navy-700 bg-navy-50' : 'border-slate-200'}`}>
                      <input type="radio" name="imageFit" className="sr-only" checked={h.hero.imageFit === fit} onChange={() => hero({ imageFit: fit })} />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted">รูปพื้นใส (PNG/WebP) เลือก &ldquo;พื้นใส&rdquo; · รูปถ่ายทั่วไปเลือก &ldquo;เต็มกรอบ&rdquo;</p>
              </fieldset>
              <Text label="คำอธิบายรูป (สำหรับ Google และผู้พิการทางสายตา)" value={h.hero.imageAlt} onChange={(imageAlt) => hero({ imageAlt })} max={120} />
            </div>
          </div>
          <Text label="ป้ายเล็กด้านบน" value={h.hero.badge} onChange={(badge) => hero({ badge })} max={60} hint="เว้นว่าง = ไม่แสดงป้าย" />
          <Text label="หัวข้อหลัก *" rows={2} value={h.hero.title} onChange={(title) => hero({ title })} max={120} hint="กด Enter เพื่อขึ้นบรรทัดใหม่" />
          <Text label="ข้อความรอง" rows={2} value={h.hero.lead} onChange={(lead) => hero({ lead })} max={300} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={h.hero.showCerts} onChange={(e) => hero({ showCerts: e.target.checked })} className="h-5 w-5" /> แสดงโลโก้มาตรฐาน ISO 9001 และ มอก. ใต้ข้อความรอง</label>
          {h.hero.showCerts && (
            <div className="max-w-xs"><ImagePicker label="รูปใบอนุญาต มอก. (ขึ้นเมื่อกดการ์ด มอก.)" value={h.hero.certImage} onChange={(certImage) => hero({ certImage })}
              aspect="aspect-[3/4]" hint="เว้นว่าง = การ์ด มอก. กดไม่ได้" /></div>
          )}
          <Text label="ข้อความเพิ่มเติม (ตัวเล็ก)" rows={2} value={h.hero.sub} onChange={(sub) => hero({ sub })} max={300} hint="เว้นว่าง = ไม่แสดง" />
          <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            <Text label="ปุ่มที่ 1 (ปุ่มหลัก) — ข้อความ" value={h.hero.btn1Label} onChange={(btn1Label) => hero({ btn1Label })} max={40} />
            <Text label="ปุ่มที่ 1 — ลิงก์ไปที่" value={h.hero.btn1Href} onChange={(btn1Href) => hero({ btn1Href })} list="page-links" placeholder="/products" />
            <Text label="ปุ่มที่ 2 — ข้อความ" value={h.hero.btn2Label} onChange={(btn2Label) => hero({ btn2Label })} max={40} hint="เว้นว่าง = ไม่แสดงปุ่ม" />
            <Text label="ปุ่มที่ 2 — ลิงก์ไปที่" value={h.hero.btn2Href} onChange={(btn2Href) => hero({ btn2Href })} list="page-links" />
            <p className="text-xs text-muted sm:col-span-2">คลิกช่องลิงก์เพื่อเลือกหน้าในเว็บ หรือพิมพ์ลิงก์ภายนอกที่ขึ้นต้นด้วย https://</p>
          </div>
        </section>

        {/* 2. การจัดวาง */}
        <section className="card grid gap-3 p-5" aria-labelledby="s-layout">
          <div>
            <h2 id="s-layout" className="text-lg font-bold">2. ลำดับและการแสดงผลส่วนต่าง ๆ</h2>
            <p className="text-sm text-muted">กดลูกศร ▲▼ เพื่อเลื่อนขึ้นลง · ปิดสวิตช์เพื่อซ่อนส่วนนั้น (แบนเนอร์อยู่บนสุดเสมอ)</p>
          </div>
          <ol className="grid gap-2">
            {h.sections.map((sec, i) => (
              <li key={sec.key} data-testid="section-row" className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${sec.visible ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50 opacity-70'}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-700 text-sm font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-semibold">{SECTION_NAME[sec.key]}{!sec.visible && <span className="ml-2 text-xs font-normal text-muted">(ซ่อนอยู่)</span>}</p>
                  <p className="text-xs text-muted">{SECTION_HELP[sec.key]}</p>
                  {sec.key !== 'cta' && (
                    <input aria-label={`หัวข้อของส่วน ${SECTION_NAME[sec.key]}`} value={sec.title} maxLength={80} className="input mt-2 py-1.5"
                      onChange={(e) => setH((x) => ({ ...x, sections: x.sections.map((y) => (y.key === sec.key ? { ...y, title: e.target.value } : y)) }))} />
                  )}
                  {sec.key === 'featured' && (
                    <label className="mt-2 flex items-center gap-2 text-sm">จำนวนสินค้าที่แสดง
                      <select value={h.featuredCount} onChange={(e) => setH((x) => ({ ...x, featuredCount: Number(e.target.value) }))} className="input w-24 py-1.5">
                        {[4, 8, 12, 16].map((n) => <option key={n} value={n}>{n} ชิ้น</option>)}
                      </select>
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setH((x) => ({ ...x, sections: move(x.sections, i, -1) }))} disabled={i === 0} className="btn-outline min-h-10 px-3" aria-label={`เลื่อน ${SECTION_NAME[sec.key]} ขึ้น`}>▲</button>
                  <button type="button" onClick={() => setH((x) => ({ ...x, sections: move(x.sections, i, 1) }))} disabled={i === h.sections.length - 1} className="btn-outline min-h-10 px-3" aria-label={`เลื่อน ${SECTION_NAME[sec.key]} ลง`}>▼</button>
                  <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" role="switch" checked={sec.visible} className="h-5 w-5"
                      onChange={(e) => setH((x) => ({ ...x, sections: x.sections.map((y) => (y.key === sec.key ? { ...y, visible: e.target.checked } : y)) }))} />
                    แสดง
                  </label>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 2.5 จุดเด่นบริการ */}
        <section className="card grid gap-3 p-5" aria-labelledby="s-feat">
          <div>
            <h2 id="s-feat" className="text-lg font-bold">จุดเด่นบริการ (ไอคอน)</h2>
            <p className="text-sm text-muted">หัวข้อแก้ได้ที่ส่วนที่ 2 · ใส่คำที่ลูกค้าค้นใน Google เช่น &quot;ถังเก็บน้ำ ถังบำบัดน้ำเสีย&quot; ช่วยให้ค้นเจอง่ายขึ้น</p>
          </div>
          <Text label="คำอธิบายใต้หัวข้อ" rows={2} value={h.features.desc} max={400} onChange={(desc) => setH((x) => ({ ...x, features: { ...x.features, desc } }))} />
          {h.features.items.map((it, i) => {
            const set = (patch: Partial<typeof it>) => setH((x) => ({ ...x, features: { ...x.features, items: x.features.items.map((y, j) => (j === i ? { ...y, ...patch } : y)) } }));
            return (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[auto_1fr_2fr_auto] sm:items-end" data-testid="feature-row">
                <label className="grid gap-1 text-sm">
                  <span className="label mb-0">ไอคอน</span>
                  <span className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-cyan-100 text-cyan-700"><Icon name={it.icon} className="h-5 w-5" /></span>
                    <select value={it.icon} onChange={(e) => set({ icon: e.target.value as IconName })} className="input w-40 py-1.5" aria-label={`ไอคอนข้อ ${i + 1}`}>
                      {Object.entries(ICON_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </span>
                </label>
                <Text label={`ข้อ ${i + 1} — หัวข้อ`} value={it.title} max={60} onChange={(title) => set({ title })} />
                <Text label="รายละเอียด" value={it.desc} max={200} onChange={(desc) => set({ desc })} />
                <button type="button" onClick={() => setH((x) => ({ ...x, features: { ...x.features, items: x.features.items.filter((_, j) => j !== i) } }))} className="btn-danger min-h-10 px-3" aria-label={`ลบข้อ ${i + 1}`}>ลบ</button>
              </div>
            );
          })}
          {h.features.items.length < 9 && (
            <button type="button" onClick={() => setH((x) => ({ ...x, features: { ...x.features, items: [...x.features.items, { icon: 'star', title: '', desc: '' }] } }))} className="btn-outline justify-self-start">+ เพิ่มข้อ</button>
          )}
        </section>

        {/* 3. จุดเด่น */}
        <section className="card grid gap-3 p-5" aria-labelledby="s-why">
          <div>
            <h2 id="s-why" className="text-lg font-bold">3. ทำไมต้อง ENTECH (กล่องข้อความ)</h2>
            <p className="text-sm text-muted">สูงสุด 8 กล่อง · กล่องที่ไม่มีหัวข้อจะไม่แสดง</p>
          </div>
          <Text label="คำโปรยใต้หัวข้อ" rows={2} value={h.whyIntro} max={300} onChange={(whyIntro) => setH((x) => ({ ...x, whyIntro }))} />
          <div className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
            {h.whyStats.map((s, i) => (
              <div key={i} className="grid grid-cols-[5rem_1fr] gap-2">
                <Text label={`ตัวเลข ${i + 1}`} value={s.value} max={12} onChange={(value) => setH((x) => ({ ...x, whyStats: x.whyStats.map((y, j) => (j === i ? { ...y, value } : y)) }))} />
                <Text label="คำอธิบาย" value={s.label} max={40} onChange={(label) => setH((x) => ({ ...x, whyStats: x.whyStats.map((y, j) => (j === i ? { ...y, label } : y)) }))} />
              </div>
            ))}
            <p className="text-xs text-muted sm:col-span-3">ตัวเลขเด่น เช่น 30+ ปีประสบการณ์ · เว้นตัวเลขว่าง = ไม่แสดงช่องนั้น</p>
          </div>
          {h.why.map((it, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <Text label={`กล่อง ${i + 1} — หัวข้อ`} value={it.title} max={60} onChange={(title) => setH((x) => ({ ...x, why: x.why.map((y, j) => (j === i ? { ...y, title } : y)) }))} />
              <Text label="รายละเอียด" value={it.desc} max={200} onChange={(desc) => setH((x) => ({ ...x, why: x.why.map((y, j) => (j === i ? { ...y, desc } : y)) }))} />
              <div className="flex gap-1">
                <button type="button" onClick={() => setH((x) => ({ ...x, why: move(x.why, i, -1) }))} disabled={i === 0} className="btn-outline min-h-10 px-3" aria-label={`เลื่อนกล่อง ${i + 1} ขึ้น`}>▲</button>
                <button type="button" onClick={() => setH((x) => ({ ...x, why: move(x.why, i, 1) }))} disabled={i === h.why.length - 1} className="btn-outline min-h-10 px-3" aria-label={`เลื่อนกล่อง ${i + 1} ลง`}>▼</button>
                <button type="button" onClick={() => setH((x) => ({ ...x, why: x.why.filter((_, j) => j !== i) }))} className="btn-danger min-h-10 px-3" aria-label={`ลบกล่อง ${i + 1}`}>ลบ</button>
              </div>
            </div>
          ))}
          {h.why.length < 8 && (
            <button type="button" onClick={() => setH((x) => ({ ...x, why: [...x.why, { title: '', desc: '' }] }))} className="btn-outline justify-self-start">+ เพิ่มกล่อง</button>
          )}
        </section>

        {/* 4. แถบปิดท้าย */}
        <section className="card grid gap-4 p-5" aria-labelledby="s-cta">
          <h2 id="s-cta" className="text-lg font-bold">4. แถบปิดท้าย</h2>
          <Text label="หัวข้อ" value={h.cta.title} onChange={(title) => cta({ title })} max={120} />
          <Text label="ข้อความ" value={h.cta.desc} onChange={(desc) => cta({ desc })} max={300} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="ปุ่ม — ข้อความ" value={h.cta.btnLabel} onChange={(btnLabel) => cta({ btnLabel })} max={40} hint="เว้นว่าง = ไม่แสดงปุ่ม" />
            <Text label="ปุ่ม — ลิงก์ไปที่" value={h.cta.btnHref} onChange={(btnHref) => cta({ btnHref })} list="page-links" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={h.cta.showLine} onChange={(e) => cta({ showLine: e.target.checked })} className="h-5 w-5" /> แสดงปุ่ม LINE</label>
        </section>

        {/* 5. SEO */}
        <section className="card grid gap-4 p-5" aria-labelledby="s-seo">
          <div>
            <h2 id="s-seo" className="text-lg font-bold">5. ข้อความบน Google (ไม่บังคับ)</h2>
            <p className="text-sm text-muted">เว้นว่าง = ใช้ค่าเริ่มต้นของเว็บ</p>
          </div>
          <Text label="Title (≤ 60 ตัวอักษร)" value={h.seoTitle} onChange={(seoTitle) => setH((x) => ({ ...x, seoTitle }))} max={70} />
          <Text label="Description (≤ 160 ตัวอักษร)" rows={2} value={h.seoDesc} onChange={(seoDesc) => setH((x) => ({ ...x, seoDesc }))} max={170} />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="text-sm text-muted underline"
            onClick={() => { if (window.confirm('คืนค่าหน้าแรกทั้งหมดเป็นแบบเริ่มต้น? (ยังไม่บันทึกจนกว่าจะกด "บันทึก")')) setH(defaults); }}>
            คืนค่าเริ่มต้นทั้งหมด
          </button>
          <SubmitButton>บันทึก</SubmitButton>
        </div>
      </ActionForm>

      {/* ตัวอย่างหน้าเว็บจริง (โหลดใหม่หลังบันทึก) */}
      <aside className="relative z-20 hidden xl:block" aria-label="ตัวอย่างหน้าแรก">
        <div className="sticky top-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">ตัวอย่าง <span className="font-normal text-muted">(อัปเดตหลังกดบันทึก)</span></p>
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
              {(['desktop', 'mobile'] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d}
                  className={`rounded-md px-3 py-1.5 ${device === d ? 'bg-navy-700 text-white' : ''}`}>{d === 'desktop' ? 'คอมพิวเตอร์' : 'มือถือ'}</button>
              ))}
            </div>
          </div>
          <div className="mx-auto overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm" style={{ width: w * scale, height: 'calc(100vh - 6rem)' }}>
            <iframe key={`${preview}-${device}`} src="/" title="ตัวอย่างหน้าแรก" tabIndex={-1}
              style={{ width: w, height: `calc((100vh - 6rem) / ${scale})`, transform: `scale(${scale})`, transformOrigin: '0 0' }} />
          </div>
        </div>
      </aside>
    </div>
  );
}

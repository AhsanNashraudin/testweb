/** ชิ้นส่วนหน้าจอหลังบ้าน (ใช้ token ใน globals.css ตาม DESIGN.md) */
import Link from 'next/link';
import { STAGES, STAGE_TH, type Stage } from '@/lib/backoffice-rules';

export type Tone = 'ok' | 'info' | 'warn' | 'bad' | 'neutral' | 'teal';
const TONE: Record<Tone, string> = {
  ok: 'bg-success-50 text-success ring-success/30', info: 'bg-navy-100 text-navy-700 ring-navy-700/20', warn: 'bg-warning-50 text-warning ring-warning/30',
  bad: 'bg-danger-50 text-sale ring-sale/30', neutral: 'bg-slate-100 text-muted ring-slate-300', teal: 'bg-cyan-100 text-navy-700 ring-cyan-600/30',
};
export const Badge = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONE[tone]}`}>{children}</span>
);

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-navy-900 md:text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, note, tone, href }: { label: string; value: string; note?: string; tone?: Tone; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink" data-testid={`kpi-${label}`}>{value}</p>
      {note && <p className={`mt-1 text-xs font-medium ${tone === 'bad' ? 'text-sale' : tone === 'warn' ? 'text-warning' : tone === 'ok' ? 'text-success' : 'text-muted'}`}>{note}</p>}
    </>
  );
  return href ? <Link href={href} className="card block p-5 hover:border-navy-700">{body}</Link> : <div className="card p-5">{body}</div>;
}

/** แถบความคืบหน้า 6 ขั้น (เขียว = ผ่านแล้ว, น้ำเงิน = กำลังทำ, แดง = เกินกำหนด) */
export function StageBar({ stage, late }: { stage: Stage; late?: boolean }) {
  const steps = STAGES.filter((x) => x !== 'done');
  const cur = stage === 'done' ? steps.length : STAGES.indexOf(stage as (typeof STAGES)[number]);
  return (
    <div className="flex gap-1" role="img" aria-label={`ขั้นตอน: ${STAGE_TH[stage]}`}>
      {steps.map((st, i) => (
        <span key={st} className={`h-1.5 w-6 rounded-full ${stage === 'cancelled' ? 'bg-slate-200' : i < cur ? 'bg-success' : i === cur ? (late ? 'bg-sale' : 'bg-navy-700') : 'bg-slate-200'}`} />
      ))}
    </div>
  );
}

export const Empty = ({ children }: { children: React.ReactNode }) => <p className="p-6 text-center text-sm text-muted">{children}</p>;

/** แท็บกรองที่เก็บค่าใน URL (แชร์ลิงก์ได้) */
export function Tabs({ items, current }: { items: { key: string; label: string; href: string; count?: number }[]; current: string }) {
  return (
    <nav aria-label="ตัวกรอง" className="flex flex-wrap gap-2">
      {items.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === current ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm ${t.key === current ? 'border-navy-700 bg-navy-700 font-semibold text-white' : 'border-slate-200 bg-white text-ink hover:border-navy-700'}`}>
          {t.label}{t.count !== undefined && <span className={`rounded-full px-2 text-xs ${t.key === current ? 'bg-white/20' : 'bg-slate-100'}`}>{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export const thDate = (sec: number) => (sec ? new Date(sec * 1000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' }) : '—');
/** วันที่เต็มมีปี พ.ศ. สำหรับเอกสาร */
export const thDateFull = (sec: number) => (sec ? new Date(sec * 1000).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' }) : '—');
export const thDateTime = (sec: number) => new Date(sec * 1000).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });

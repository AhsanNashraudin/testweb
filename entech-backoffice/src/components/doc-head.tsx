import Image from 'next/image';
import type { Company } from '@/lib/company';

/** หัวกระดาษเอกสาร แสดงเฉพาะตอนพิมพ์/บันทึก PDF */
export function DocHead({ c, title, code, lines }: { c: Company; title: string; code: string; lines: [string, string][] }) {
  return (
    <div className="mb-6 hidden items-start justify-between gap-6 border-b-2 border-navy-900 pb-4 print:flex">
      <div className="flex gap-4"><Image src="/logo.png" alt="ENTECH" width={90} height={54} className="h-14 w-auto" />
        <div className="text-xs leading-relaxed"><b className="text-sm">{c.name}</b><br />{c.address}<br />{c.taxId && `เลขประจำตัวผู้เสียภาษี ${c.taxId} · `}โทร {c.phone}</div></div>
      <div className="text-right"><p className="text-xl font-bold text-navy-900">{title}</p><p className="font-semibold">{code}</p>
        {lines.map(([k, v]) => <p key={k} className="text-xs">{k} {v}</p>)}</div>
    </div>
  );
}

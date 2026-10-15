import { ActionForm, SubmitButton } from '@/components/action-form';
import { saveArticle } from '../actions';

type A = { id: number; slug: string; title: string; excerpt: string; body: string; seoTitle: string; seoDesc: string; published: boolean };

/** ฟอร์มบทความ ใช้ทั้งหน้าเขียนใหม่และหน้าแก้ไข (ไม่ใส่ HTML ได้ เนื้อหาเป็นข้อความล้วน) */
export function ArticleForm({ article: a }: { article?: A }) {
  return (
    <ActionForm action={saveArticle} className="max-w-3xl space-y-5">
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-slate-100/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <h1 className="min-w-0 truncate text-2xl font-bold">{a ? `แก้ไข: ${a.title}` : 'เขียนบทความใหม่'}</h1>
        <SubmitButton>บันทึก</SubmitButton>
      </div>
      <section className="card grid gap-4 p-5">
        <div><label className="label" htmlFor="title">หัวข้อ *</label><input id="title" name="title" defaultValue={a?.title} className="input w-full" required maxLength={150} /></div>
        <div>
          <label className="label" htmlFor="slug">slug (ส่วนท้ายของลิงก์) *</label>
          <input id="slug" name="slug" defaultValue={a?.slug} className="input w-full" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} placeholder="how-to-choose-tank" />
          <p className="mt-1 text-xs text-muted">ลิงก์จะเป็น /articles/ตามด้วย slug เช่น how-to-choose-tank</p>
        </div>
        <div><label className="label" htmlFor="excerpt">คำอธิบายสั้น (แสดงในรายการ)</label><input id="excerpt" name="excerpt" defaultValue={a?.excerpt} className="input w-full" maxLength={300} /></div>
      </section>
      <section className="card grid gap-4 p-5">
        <div>
          <label className="label" htmlFor="body">เนื้อหา</label>
          <textarea id="body" name="body" defaultValue={a?.body} rows={16} className="input w-full" placeholder="เว้นบรรทัดว่างหนึ่งบรรทัดเพื่อขึ้นย่อหน้าใหม่" />
        </div>
      </section>
      <section className="card grid gap-4 p-5">
        <p className="font-semibold">SEO (ไม่บังคับ)</p>
        <div><label className="label" htmlFor="seoTitle">Title สำหรับ Google</label><input id="seoTitle" name="seoTitle" defaultValue={a?.seoTitle} className="input w-full" maxLength={70} /></div>
        <div><label className="label" htmlFor="seoDesc">Description สำหรับ Google</label><textarea id="seoDesc" name="seoDesc" defaultValue={a?.seoDesc} rows={2} className="input w-full" maxLength={180} /></div>
      </section>
      <label className="card flex items-center gap-3 p-5 font-semibold">
        <input type="checkbox" name="published" defaultChecked={a?.published} className="h-5 w-5" />
        เผยแพร่บนเว็บ (ปิดไว้ = ยังไม่แสดงให้ลูกค้าเห็น)
      </label>
    </ActionForm>
  );
}

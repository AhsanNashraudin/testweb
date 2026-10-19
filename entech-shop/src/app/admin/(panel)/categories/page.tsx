import Link from 'next/link';
import { ActionForm, SubmitButton } from '@/components/action-form';
import { ImagePicker } from '@/components/image-picker';
import { getCategories } from '@/lib/catalog';
import { saveCategory } from '../actions';

export const metadata = { title: 'หมวดสินค้า' };

/** ชื่อ คำอธิบาย และรูปของแต่ละหมวด — รูปนี้ขึ้นในหน้าแรก และขึ้นในเมนู "สินค้า" เมื่อเอาเมาส์ชี้ชื่อหมวด */
export default async function Categories() {
  const cats = await getCategories();
  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">หมวดสินค้า</h1>
        <p className="text-sm text-muted">รูปหมวดแสดงในหน้าแรก และขึ้นในเมนู &quot;สินค้า&quot; เมื่อลูกค้าเอาเมาส์ชี้ชื่อหมวด · แนะนำรูปสี่เหลี่ยมจัตุรัสพื้นขาว</p>
      </div>
      {cats.map((c) => (
        <ActionForm key={c.id} action={saveCategory} className="card grid gap-4 p-5 md:grid-cols-[220px_1fr]" data-testid="category-form">
          <input type="hidden" name="id" value={c.id} />
          <ImagePicker name="image" value={c.image} label="รูปหมวด" aspect="aspect-square" max={1000} hint="ลากไฟล์มาวางได้" />
          <div className="grid content-start gap-3">
            <div><label className="label" htmlFor={`name-${c.id}`}>ชื่อหมวด</label><input id={`name-${c.id}`} name="name" defaultValue={c.name} className="input" maxLength={80} required /></div>
            <div><label className="label" htmlFor={`desc-${c.id}`}>คำอธิบาย</label><textarea id={`desc-${c.id}`} name="description" defaultValue={c.description} rows={3} className="input" maxLength={400} /></div>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton>บันทึก</SubmitButton>
              <Link href={`/products/${c.slug}`} target="_blank" className="text-sm text-navy-700 underline">ดูหน้าหมวดนี้ ↗</Link>
            </div>
          </div>
        </ActionForm>
      ))}
    </div>
  );
}

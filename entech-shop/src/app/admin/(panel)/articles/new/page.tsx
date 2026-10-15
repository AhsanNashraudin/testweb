import Link from 'next/link';
import { ArticleForm } from '../article-form';

export const metadata = { title: 'เขียนบทความใหม่' };

export default function NewArticle() {
  return (
    <div className="space-y-4">
      <Link href="/admin/articles" className="text-sm text-navy-700 underline">← กลับไปรายการบทความ</Link>
      <ArticleForm />
    </div>
  );
}

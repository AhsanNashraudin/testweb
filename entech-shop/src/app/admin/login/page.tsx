import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'เข้าสู่ระบบหลังบ้าน', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '/admin' } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 p-4">
      <LoginForm next={next} />
    </div>
  );
}

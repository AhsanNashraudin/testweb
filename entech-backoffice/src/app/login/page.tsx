import { LoginForm } from './login-form';

export const metadata = { title: 'เข้าสู่ระบบ' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '/' } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 bg-[radial-gradient(circle_at_20%_10%,#254b7c_0,transparent_45%),radial-gradient(circle_at_90%_90%,#0072b1_0,transparent_35%)] p-4">
      <LoginForm next={next} />
    </div>
  );
}

'use client';
import Image from 'next/image';
import { useActionState } from 'react';
import { login } from './actions';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-2xl">
      <Image src="/logo.png" alt="ENTECH" width={92} height={55} priority />
      <div><h1 className="text-2xl font-bold text-navy-900">ระบบหลังบ้าน</h1><p className="text-sm text-muted">สต็อก · ขาย · โรงงาน · บัญชี</p></div>
      <input type="hidden" name="next" value={next} />
      <div><label className="label" htmlFor="email">อีเมล</label><input id="email" name="email" type="email" required defaultValue={state?.email} key={state?.email} className="input" autoComplete="username" spellCheck={false} /></div>
      <div><label className="label" htmlFor="password">รหัสผ่าน</label><input id="password" name="password" type="password" required className="input" autoComplete="current-password" /></div>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}</button>
    </form>
  );
}

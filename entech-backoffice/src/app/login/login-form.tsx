'use client';
import Image from 'next/image';
import { useActionState, useEffect, useRef } from 'react';
import { login } from './actions';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  const pw = useRef<HTMLInputElement>(null);
  useEffect(() => { if (state?.error) pw.current?.focus(); }, [state]);
  return (
    <form action={action} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-2xl">
      <Image src="/logo.png" alt="ENTECH" width={92} height={55} priority />
      <div><h1 className="text-2xl font-bold text-navy-900">ระบบหลังบ้าน</h1><p className="mt-1 text-sm text-muted">สำหรับพนักงาน ENTECH ใช้จัดการออเดอร์ ใบเสนอราคา สต็อก งานผลิต และบัญชี</p></div>
      <input type="hidden" name="next" value={next} />
      <div><label className="label" htmlFor="email">อีเมล</label><input id="email" name="email" type="email" required defaultValue={state?.email} key={state?.email} className="input" autoComplete="username" spellCheck={false} /></div>
      <div><label className="label" htmlFor="password">รหัสผ่าน</label><input id="password" name="password" type="password" required ref={pw} aria-invalid={!!state?.error} aria-describedby={state?.error ? 'login-err' : undefined} className="input" autoComplete="current-password" /></div>
      {state?.error && <p id="login-err" className="err" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}</button>
      <p className="text-center text-xs text-muted">ลืมรหัสผ่านหรือยังไม่มีบัญชี ติดต่อผู้ดูแลระบบของบริษัท</p>
    </form>
  );
}

import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, verifySession } from '@/lib/session';

export async function middleware(req: NextRequest) {
  if (await verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  const url = new URL('/login', req.url);
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// ทุกหน้าต้องล็อกอิน ยกเว้นหน้าเข้าสู่ระบบ, cron (ใช้ CRON_SECRET) และไฟล์ static
export const config = { matcher: ['/((?!login|api/cron|_next|favicon.ico|icon.png|logo.png|manifest\\.webmanifest$).*)'] };

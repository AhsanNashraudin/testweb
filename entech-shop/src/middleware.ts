import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, verifySession } from '@/lib/session';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next();
  if (await verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  const url = new URL('/admin/login', req.url);
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/admin/:path*'] };

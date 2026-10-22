/** Vercel Cron เรียกทุก 5 นาที (vercel.json) · ป้องกันด้วย CRON_SECRET */
import { NextResponse } from 'next/server';
import { runSync } from '@/lib/sync';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const r = await runSync();
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}

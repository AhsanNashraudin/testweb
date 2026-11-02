import { NextResponse, after } from 'next/server';
import { createOrder, CheckoutError } from '@/lib/checkout';
import { readJson, apiError } from '@/lib/api';
import { onNewOrder } from '@/lib/notify';

export async function POST(req: Request) {
  try {
    const o = await createOrder(await readJson(req));
    after(() => onNewOrder(o).catch((e) => console.error('✗ แจ้งเตือนคำสั่งซื้อ:', e)));
    return NextResponse.json({ code: o.code, key: o.accessKey }, { status: 201 });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message, fields: e.fields }, { status: 400 });
    return apiError(e);
  }
}

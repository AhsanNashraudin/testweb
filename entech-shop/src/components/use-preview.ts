'use client';
import { useEffect, useState } from 'react';
import type { Preview } from '@/lib/checkout';
import type { CartItem } from './cart-store';

/** ขอราคา/ค่าส่งล่าสุดจาก server ทุกครั้งที่ตะกร้า จังหวัด หรือคูปองเปลี่ยน
 *  fresh = ข้อมูลตรงกับค่าปัจจุบันจริง (ถ้าโหลดใหม่ไม่สำเร็จ ห้ามใช้ค่าส่งเก่าของจังหวัดก่อนหน้า) */
export function usePreview(items: CartItem[], province = '', couponCode = '') {
  const [state, setState] = useState<{ data: Preview | null; key: string }>({ data: null, key: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify([items, province, couponCode]);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/checkout/preview', {
          method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctrl.signal,
          body: JSON.stringify({ items, province, couponCode }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error || 'server');
        setState({ data: await r.json(), key });
      } catch (e) {
        if (ctrl.signal.aborted) return;
        const m = (e as Error).message;
        setError(m === 'server' || e instanceof TypeError ? 'คำนวณราคา/ค่าส่งไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วกด “ลองใหม่”' : m);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);
  return { data: state.data, fresh: state.key === key && !error, loading, error, retry: () => setNonce((n) => n + 1) };
}

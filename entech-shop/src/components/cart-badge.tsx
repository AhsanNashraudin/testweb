'use client';
import Link from 'next/link';
import { useCart } from './cart-store';

export function CartBadge() {
  const count = useCart().reduce((s, i) => s + i.qty, 0);
  return (
    <Link href="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-navy-700 text-white" aria-label={`ตะกร้าสินค้า ${count} ชิ้น`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
      {count > 0 && <span data-testid="cart-count" className="absolute -right-1 -top-1 min-w-5 rounded-full bg-sale px-1 text-center text-[11px] font-bold leading-5">{count}</span>}
    </Link>
  );
}

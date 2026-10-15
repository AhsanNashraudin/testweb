import type { Metadata } from 'next';
import { CartView } from '@/components/cart-view';

export const metadata: Metadata = { title: 'ตะกร้าสินค้า', robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold text-navy-900">ตะกร้าสินค้า</h1>
      <CartView />
    </div>
  );
}

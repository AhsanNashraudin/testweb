import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout-form';
import { getContact } from '@/lib/content';

export const metadata: Metadata = { title: 'ชำระเงิน', robots: { index: false } };

export default async function CheckoutPage() {
  const CONTACT = await getContact();
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold text-navy-900">ชำระเงิน</h1>
      <CheckoutForm pickupAddress={`${CONTACT.address} (${CONTACT.hours})`} />
    </div>
  );
}

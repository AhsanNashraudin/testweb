export const STATUS_TH: Record<string, string> = {
  pending_payment: 'รอชำระเงิน', paid: 'ชำระแล้ว', preparing: 'กำลังเตรียมสินค้า', shipping: 'กำลังจัดส่ง', completed: 'สำเร็จ', cancelled: 'ยกเลิก',
};
export const QUOTE_STATUS_TH: Record<string, string> = { draft: 'ร่าง', sent: 'ส่งลูกค้าแล้ว', won: 'ปิดการขาย', lost: 'ไม่สำเร็จ' };
export const QUOTE_TONE = { draft: 'neutral', sent: 'info', won: 'ok', lost: 'bad' } as const;
export const MO_TH: Record<string, string> = { waiting: 'รอวัตถุดิบ', queued: 'คิวผลิต', in_progress: 'กำลังผลิต', qc: 'ทดสอบรั่วซึม', done: 'เข้าคลังแล้ว', cancelled: 'ยกเลิก' };
export const MO_TONE = { waiting: 'warn', queued: 'neutral', in_progress: 'info', qc: 'teal', done: 'ok', cancelled: 'neutral' } as const;
export const ETAX_TH: Record<string, string> = { pending: 'รอส่ง', sent: 'ส่งแล้ว รอรับรอง', certified: 'รับรองแล้ว', failed: 'ส่งไม่สำเร็จ' };
export const ETAX_TONE = { pending: 'warn', sent: 'info', certified: 'ok', failed: 'bad' } as const;

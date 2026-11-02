export const STATUS_TH: Record<string, string> = {
  pending_payment: 'รอชำระเงิน', paid: 'ชำระแล้ว', preparing: 'กำลังเตรียมสินค้า', shipping: 'กำลังจัดส่ง', completed: 'สำเร็จ', cancelled: 'ยกเลิก',
};
export const QUOTE_STATUS_TH: Record<string, string> = { new: 'ใหม่', in_progress: 'กำลังดำเนินการ', sent: 'ส่งใบเสนอราคาแล้ว', won: 'ปิดการขาย', lost: 'ไม่สำเร็จ' };
/** หัวข้อในฟอร์มขอใบเสนอราคา/ติดต่อ (ใช้กำหนดว่าเซลล์คนไหนดูแลหัวข้อไหน ในหน้า "ทีมขาย & แจ้งเตือน") */
export const QUOTE_TOPICS = {
  contact: ['สอบถามสินค้า', 'ขอใบเสนอราคา', 'บริการหลังการขาย', 'อื่นๆ'],
  services: ['ระบบบำบัดน้ำเสีย', 'ถังเก็บน้ำ (สั่งจำนวนมาก)', 'ถังเก็บสารเคมี / งานอุตสาหกรรม', 'งานเคลือบไฟเบอร์กลาส', 'อื่นๆ'],
  product: ['ขอราคาสินค้า (สั่งจำนวนมาก/โครงการ)', 'ระบบบำบัดน้ำเสีย', 'อื่นๆ'],
};
export const ALL_QUOTE_TOPICS = [...new Set(Object.values(QUOTE_TOPICS).flat())];

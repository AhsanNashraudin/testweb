import 'server-only';
import { getSetting } from './backoffice';

export type Company = { name: string; taxId: string; address: string; phone: string };
const DEFAULT: Company = { name: 'บริษัท เอ็นเทค โปรดักส์ จำกัด', taxId: '', address: '', phone: '063-206-1000' };
/** หัวเอกสาร (ใบเสนอราคา / ใบกำกับภาษี) ตั้งค่าได้ที่หน้า "เชื่อมเว็บไซต์ & ตั้งค่า" */
/** ช่องที่ใบกำกับภาษีต้องมีแต่ยังไม่ได้กรอก (ว่าง = พร้อมออกเอกสาร) */
export function companyMissing(c: Company) {
  const m: string[] = [];
  if (c.name.trim().length < 2) m.push('ชื่อบริษัท');
  if (!/^\d{13}$/.test(c.taxId.replace(/\D/g, ''))) m.push('เลขประจำตัวผู้เสียภาษี 13 หลัก');
  if (c.address.trim().length < 10) m.push('ที่อยู่บริษัท');
  return m;
}
export async function getCompany(): Promise<Company> {
  try { return { ...DEFAULT, ...JSON.parse(await getSetting('company', '{}')) }; } catch { return DEFAULT; }
}

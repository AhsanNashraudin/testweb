import 'server-only';
import { getSetting } from './backoffice';

export type Company = { name: string; taxId: string; address: string; phone: string };
const DEFAULT: Company = { name: 'บริษัท เอ็นเทค โปรดักส์ จำกัด', taxId: '', address: '', phone: '063-206-1000' };
/** หัวเอกสาร (ใบเสนอราคา / ใบกำกับภาษี) ตั้งค่าได้ที่หน้า "เชื่อมเว็บไซต์ & ตั้งค่า" */
export async function getCompany(): Promise<Company> {
  try { return { ...DEFAULT, ...JSON.parse(await getSetting('company', '{}')) }; } catch { return DEFAULT; }
}

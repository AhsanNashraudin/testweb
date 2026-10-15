/** หา URL/Token ของฐานข้อมูล: DATABASE_URL (ตั้งเอง) หรือค่าที่ Turso บน Vercel Marketplace ใส่ให้
 *  (ชื่อ TURSO_DATABASE_URL หรือมี prefix ที่ตั้งตอนเชื่อม เช่น ENTECH_TURSO_DATABASE_URL) */
const find = (exact: string, suffix: string) =>
  process.env[exact] || Object.entries(process.env).find(([k, v]) => k.endsWith(suffix) && v)?.[1] || '';
export const dbUrl = () => find('DATABASE_URL', 'TURSO_DATABASE_URL') || 'file:./data/entech.db';
export const dbToken = () => find('DATABASE_AUTH_TOKEN', 'TURSO_AUTH_TOKEN') || undefined;

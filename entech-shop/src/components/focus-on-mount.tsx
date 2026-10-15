'use client';
import { useEffect } from 'react';
/** ย้าย focus ไปที่ element (เช่นหัวข้อ "ขอบคุณ…") เพื่อให้ผู้ใช้ screen reader/คีย์บอร์ดรู้ว่าหน้าเปลี่ยนแล้ว */
export function FocusOnMount({ id }: { id: string }) {
  useEffect(() => { document.getElementById(id)?.focus(); }, [id]);
  return null;
}

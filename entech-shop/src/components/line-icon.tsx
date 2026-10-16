/** ไอคอนแชทสำหรับปุ่ม LINE
 *  ถ้าต้องการโลโก้ LINE ทางการ: วางไฟล์จาก LINE (brand resources / LINE OA Manager) ไว้ที่ public/images/line-icon.png
 *  แล้วตั้ง NEXT_PUBLIC_LINE_ICON=1 — ระบบจะใช้รูปนั้นแทนไอคอนนี้ทุกปุ่ม */
export function LineIcon({ className = 'h-5 w-5' }: { className?: string }) {
  if (process.env.NEXT_PUBLIC_LINE_ICON === '1') {
    // eslint-disable-next-line @next/next/no-img-element -- ไอคอนเล็ก ไม่ต้องผ่านตัวย่อรูป
    return <img src="/images/line-icon.png" alt="" aria-hidden className={`${className} rounded-[22%]`} />;
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.6s5.9-3.5 8.1-6C21.6 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8Z" />
    </svg>
  );
}

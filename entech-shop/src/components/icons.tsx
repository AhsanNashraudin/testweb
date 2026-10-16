/** ไอคอนเส้น 24×24 ที่ใช้ทั้งเว็บ (วาดเอง ไม่พึ่งไลบรารี) — scripts/make-covers.py ใช้ path ชุดเดียวกันทำรูปปก */
export const ICON = {
  treatment: 'M12 4s4 4.4 4 7.5a4 4 0 0 1-8 0C8 8.4 12 4 12 4Z M3.5 13a8.5 8.5 0 0 0 14.6 5.8 M20.5 11A8.5 8.5 0 0 0 5.9 5.2 M18.5 21.5v-2.8h-2.8 M5.5 2.5v2.8h2.8',
  capsule: 'M6 8h12a4 4 0 0 1 0 8H6a4 4 0 0 1 0-8Z M10 8V5.5h4V8 M7 16v3 M17 16v3 M10 12h4',
  tank: 'M7 6c0-1.7 2.2-3 5-3s5 1.3 5 3v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z M7 6c0 1.7 2.2 3 5 3s5-1.3 5-3 M7 12.5h10 M7 16.5h10',
  flask: 'M9 3h6 M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3 M7.3 15h9.4',
  wind: 'M3 8h10a3 3 0 1 0-3-3 M3 12h15a3 3 0 1 1-3 3 M3 16h7',
  roller: 'M4 3h13a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M18 5.5h2.5V11H11v3 M10 14h2v7h-2Z',
  leaf: 'M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z M5 19c3-4 6.5-7 10.5-9',
  door: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17 M3 21h18 M14.5 12h.5',
  pen: 'M3 21l3.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11Z M13.5 7.5l3 3 M14 21h7',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z M8 11h.5 M12 11h.5 M16 11h.5',
  factory: 'M2 20h20M4 20V9l5 3V9l5 3V5h6v15M8 16h2m4 0h2',
  truck: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  heart: 'M12 20s-7.5-4.6-9.2-9.3C1.7 7.6 3.6 4.5 6.8 4.5c2 0 3.4 1.1 4.2 2.4h2c.8-1.3 2.2-2.4 4.2-2.4 3.2 0 5.1 3.1 4 6.2C19.5 15.4 12 20 12 20Z',
  book: 'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Zm0 15a2 2 0 0 0 2 2h13v-4 M8 7h7 M8 11h5',
  school: 'M3 21h18 M5 21V10l7-5 7 5v11 M10 21v-5h4v5 M9 12h.5 M14.5 12h.5',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5',
  utensils: 'M5 3v8a2 2 0 0 0 2 2v8 M9 3v8a2 2 0 0 1-2 2 M7 3v6 M17 21V3c-2 1-3.5 3.5-3.5 7v4H17',
} as const;
export type IconName = keyof typeof ICON;

export function Icon({ name, className = 'h-6 w-6' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={ICON[name]} />
    </svg>
  );
}

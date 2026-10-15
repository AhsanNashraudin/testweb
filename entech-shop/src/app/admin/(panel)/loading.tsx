export default function Loading() {
  return <div role="status" className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /><div className="h-64 animate-pulse rounded-2xl bg-white" /><span className="sr-only">กำลังโหลด…</span></div>;
}

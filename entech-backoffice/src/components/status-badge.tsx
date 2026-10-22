import { STATUS_TH } from '@/lib/status';

const TONE: Record<string, string> = {
  pending_payment: 'bg-warning-50 text-warning ring-warning/30', paid: 'bg-cyan-100 text-navy-700 ring-cyan-600/30',
  preparing: 'bg-navy-100 text-navy-700 ring-navy-700/20', shipping: 'bg-navy-100 text-navy-700 ring-navy-700/20',
  completed: 'bg-success-50 text-success ring-success/30', cancelled: 'bg-slate-100 text-muted ring-slate-300',
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONE[status] ?? ''}`}>{STATUS_TH[status] ?? status}</span>;
}

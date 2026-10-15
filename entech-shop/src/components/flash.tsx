export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (err) return <p role="alert" data-testid="flash-err" className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-sale">{err}</p>;
  if (ok) return <p role="status" data-testid="flash-ok" className="mb-4 rounded-lg bg-success-50 p-3 text-sm text-success">✓ {ok}</p>;
  return null;
}
export type FlashParams = Promise<{ ok?: string; err?: string }>;

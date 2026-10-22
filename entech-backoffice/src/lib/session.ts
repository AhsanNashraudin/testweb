/** Session แอดมินแบบ cookie ที่เซ็นด้วย HMAC-SHA256 (Web Crypto → ใช้ได้ทั้ง middleware และ server) */
export const COOKIE = 'entech_bo';
const MAX_AGE = 7 * 24 * 3600;
const enc = new TextEncoder();

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร');
    return 'dev-only-insecure-secret-change-me-0000';
  }
  return s;
}
const key = () => crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
const b64u = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export async function signSession(adminId: number) {
  const payload = b64u(enc.encode(JSON.stringify({ id: adminId, exp: Math.floor(Date.now() / 1000) + MAX_AGE })));
  const sig = b64u(await crypto.subtle.sign('HMAC', await key(), enc.encode(payload)));
  return { value: `${payload}.${sig}`, maxAge: MAX_AGE };
}

export async function verifySession(token: string | undefined): Promise<{ id: number } | null> {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await key(), unb64u(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64u(payload)));
    return typeof data.id === 'number' && data.exp > Date.now() / 1000 ? { id: data.id } : null;
  } catch {
    return null;
  }
}

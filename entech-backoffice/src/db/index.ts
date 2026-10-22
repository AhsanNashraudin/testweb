import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { dbUrl, dbToken } from './env';

// DATABASE_URL: file:./data/backoffice.db (dev) หรือ libsql://<db>.turso.io (production)
// บน Vercel ที่เชื่อม Turso ผ่าน Marketplace จะได้ TURSO_DATABASE_URL / TURSO_AUTH_TOKEN มาให้อัตโนมัติ
const url = dbUrl();
const g = globalThis as unknown as { __entechBoDb?: ReturnType<typeof createClient> };
const client = g.__entechBoDb ?? createClient({ url, authToken: dbToken() });
if (process.env.NODE_ENV !== 'production') g.__entechBoDb = client;

export const db = drizzle(client, { schema });
export { schema };

import { defineConfig } from 'drizzle-kit';
import { dbUrl, dbToken } from './src/db/env';
export default defineConfig({
  schema: './src/db/schema.ts',
  dialect: 'turso',
  dbCredentials: { url: dbUrl(), authToken: dbToken() },
});

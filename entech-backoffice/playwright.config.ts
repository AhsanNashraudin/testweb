import { defineConfig, devices } from '@playwright/test';

// ฐานข้อมูลทดสอบแยก (data/test.db) ล้างใหม่ทุกครั้ง · ไม่ต่อเว็บจริง (ไม่ตั้ง WEB_API_URL)
const env = { DATABASE_URL: 'file:./data/test.db', SESSION_SECRET: 'test-secret-test-secret-test-secret-123', ADMIN_EMAIL: 'admin@entech.local', ADMIN_PASSWORD: 'Entech@2026', WEB_API_URL: '', WEB_API_KEY: '' };

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3101', locale: 'th-TH', trace: 'retain-on-failure', launchOptions: { executablePath: process.env.PW_CHROMIUM } },
  webServer: {
    command: 'node -e "require(\'fs\').rmSync(\'data/test.db\',{force:true})" && npx drizzle-kit push --force && npx tsx --conditions=react-server tests/fixtures/setup-db.ts && npx tsx --conditions=react-server scripts/seed.ts && npx next start -p 3101',
    url: 'http://localhost:3101/login',
    env,
    timeout: 180_000,
    reuseExistingServer: false,
  },
});

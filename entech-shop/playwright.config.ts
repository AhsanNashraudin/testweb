import { defineConfig, devices } from '@playwright/test';

// รันกับฐานข้อมูลทดสอบแยก (data/test.db) ที่ล้างและ seed ใหม่ทุกครั้ง
const env = { DATABASE_URL: 'file:./data/test.db', SITE_URL: 'http://localhost:3100', SESSION_SECRET: 'test-secret-test-secret-test-secret-123', ADMIN_EMAIL: 'admin@entech.local', ADMIN_PASSWORD: 'Entech@2026' };

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3100', locale: 'th-TH', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.PW_CHROMIUM } }, testIgnore: /(mobile|admin)\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { executablePath: process.env.PW_CHROMIUM } }, testMatch: /mobile\.spec/ },
    // หลังบ้านแก้ข้อมูลจริงใน DB ทดสอบ (ค่าส่ง/ราคา) จึงรันหลังชุดหน้าร้านเสมอ
    { name: 'admin', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.PW_CHROMIUM } }, testMatch: /admin\.spec/, dependencies: ['desktop', 'mobile'] },
  ],
  webServer: {
    command: 'node -e "require(\'fs\').rmSync(\'data/test.db\',{force:true})" && npx drizzle-kit push --force && npx tsx scripts/seed.ts && npx tsx tests/fixtures/setup-db.ts && npx next start -p 3100',
    url: 'http://localhost:3100',
    env,
    timeout: 120_000,
    reuseExistingServer: false,
  },
});

// สร้างไฟล์สำหรับอัปขึ้น Hostatom (Plesk → Node.js) — ดูขั้นตอนใน docs/DEPLOY-HOSTATOM.md
// ผลลัพธ์: deploy/entech-hostatom.zip (แตกไฟล์ในโฟลเดอร์แอปบนโฮสต์ แล้วตั้ง Startup File = app.js)
import { execSync } from 'node:child_process';
import { platform } from 'node:os';

// ไลบรารี native (ฐานข้อมูล libsql, ย่อรูป sharp) ต้องเป็นของ Linux → ต้อง build บน Linux/WSL เท่านั้น
if (platform() !== 'linux') { console.error('✗ ต้องรันบน Linux หรือ WSL (โฮสต์เป็น Linux) — ใน Windows ให้เปิด WSL แล้วรันคำสั่งนี้'); process.exit(1); }
import { cpSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const run = (cmd, env = {}) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
const OUT = '.next/standalone';

rmSync('.next', { recursive: true, force: true });
// หน้าที่สร้างไว้ล่วงหน้าตอน build ใช้ SITE_URL นี้ (โดเมนจริงของลูกค้า)
const SITE_URL = process.env.SITE_URL || 'https://www.entechproducts.co.th';
console.log(`โดเมน: ${SITE_URL}`);
run('npx next build', { BUILD_STANDALONE: '1', NEXT_TELEMETRY_DISABLED: '1', SITE_URL });

// standalone ไม่รวมไฟล์ static/รูปภาพ → คัดลอกเข้าไปเอง
cpSync('public', `${OUT}/public`, { recursive: true });
cpSync('.next/static', `${OUT}/.next/static`, { recursive: true });
rmSync(`${OUT}/public/canva`, { recursive: true, force: true }); // ไฟล์ทำงานชั่วคราว ไม่ต้องขึ้นโฮสต์
// โฮสต์ Hostatom เป็น Linux x64 (glibc) → ไม่ต้องใช้ไลบรารีของ musl/wasm และ TypeScript (ลดขนาดไฟล์ให้อัปโหลดง่าย)
for (const f of ['@img/sharp-libvips-linuxmusl-x64', '@img/sharp-linuxmusl-x64', '@img/sharp-wasm32', 'typescript']) rmSync(`${OUT}/node_modules/${f}`, { recursive: true, force: true });
for (const f of ['.env', '.env.local', 'data']) rmSync(`${OUT}/${f}`, { recursive: true, force: true }); // ห้ามมีความลับ/ฐานข้อมูลทดสอบติดไป

// Plesk (Phusion Passenger) เรียกไฟล์เริ่มต้นนี้ — ฟังทุก interface ตาม PORT ที่โฮสต์กำหนด
writeFileSync(`${OUT}/app.js`, `// Startup file สำหรับ Plesk Node.js
process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '0.0.0.0';
require('./server.js');
`);

mkdirSync('deploy', { recursive: true });
if (existsSync('deploy/entech-hostatom.zip')) rmSync('deploy/entech-hostatom.zip');
run(`cd ${OUT} && zip -qr -y ../../deploy/entech-hostatom.zip . -x "*.map"`);
console.log('\n✓ deploy/entech-hostatom.zip พร้อมอัปโหลด');

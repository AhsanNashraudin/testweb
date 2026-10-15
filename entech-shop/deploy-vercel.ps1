# ขึ้นเว็บตัวอย่าง ENTECH บน Vercel + Turso
# วิธีใช้: คลิกขวาที่โฟลเดอร์ entech-shop > Open in Terminal แล้วพิมพ์
#   powershell -ExecutionPolicy Bypass -File .\deploy-vercel.ps1
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$Project = 'entech-demo'

function Step($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }
function Fail($t) { Write-Host "X $t" -ForegroundColor Red; Read-Host 'กด Enter เพื่อปิด'; exit 1 }
function Rand($n) { $b = New-Object byte[] $n; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | ForEach-Object { $_.ToString('x2') }) }

Step '1/5 ตรวจ Node.js'
$nv = (node -v) 2>$null
if (-not $nv) { Start-Process 'https://nodejs.org/en/download'; Fail 'ยังไม่มี Node.js - ติดตั้งรุ่น LTS แล้วรันสคริปต์นี้ใหม่' }
Write-Host "Node $nv"

Step '2/5 ล็อกอิน Vercel และสร้างโปรเจกต์ (เบราว์เซอร์จะเปิดให้ล็อกอินครั้งแรก)'
npx --yes vercel@latest link --yes --project $Project
if ($LASTEXITCODE -ne 0) { Fail 'สร้าง/เชื่อมโปรเจกต์ไม่สำเร็จ' }

Step '3/5 ตั้งรหัสลับและบัญชีแอดมิน'
$secretFile = '.vercel\demo-admin.txt'   # .vercel ไม่ถูกอัปโหลด
if (Test-Path $secretFile) { $lines = Get-Content $secretFile; $Secret = $lines[0]; $Pass = $lines[1] }
else { $Secret = Rand 32; $Pass = 'Et-' + (Rand 6); Set-Content $secretFile @($Secret, $Pass) }
$Email = 'admin@entech-products.com'
foreach ($kv in @(@('SESSION_SECRET', $Secret), @('ADMIN_EMAIL', $Email), @('ADMIN_PASSWORD', $Pass))) {
  npx vercel env rm $kv[0] production --yes *> $null
  $kv[1] | npx vercel env add $kv[0] production *> $null
  if ($LASTEXITCODE -ne 0) { Fail "ตั้งค่า $($kv[0]) ไม่สำเร็จ" }
  Write-Host "OK $($kv[0])"
}

Step '4/5 เชื่อมฐานข้อมูล Turso (ฟรี)'
Write-Host 'เบราว์เซอร์จะเปิดหน้า Turso บน Vercel Marketplace:'
Write-Host "  1) กด Install / Create  2) ตั้งชื่อฐานข้อมูล เลือกภูมิภาคใกล้ไทย (เช่น Singapore/Tokyo)"
Write-Host "  3) Connect Project -> เลือก $Project (ติ๊ก Production)"
Start-Process 'https://vercel.com/marketplace/tursocloud'
while ($true) {
  Read-Host 'เชื่อมเสร็จแล้วกด Enter'
  $envs = (npx vercel env ls production 2>&1) -join "`n"
  if ($envs -match 'TURSO_DATABASE_URL|DATABASE_URL') { Write-Host 'OK พบฐานข้อมูล'; break }
  Write-Host 'ยังไม่พบ TURSO_DATABASE_URL ในโปรเจกต์ - ตรวจว่าเลือกโปรเจกต์และ Production แล้ว' -ForegroundColor Yellow
}

Step '5/5 Deploy (ประมาณ 2-4 นาที)'
$url = (npx vercel deploy --prod --yes | Select-Object -Last 1).Trim()
if ($LASTEXITCODE -ne 0 -or -not $url) { Fail 'Deploy ไม่สำเร็จ - ดู log ด้านบน หรือในหน้า Vercel > Deployments' }
# ลิงก์ของ deployment แต่ละครั้งต้องล็อกอิน Vercel ถึงจะเปิดได้ - ลิงก์ที่ส่งลูกค้าคือโดเมน production (alias)
$aliases = (npx vercel inspect $url 2>&1) -join "`n" | Select-String -Pattern 'https://[a-z0-9.-]+\.vercel\.app' -AllMatches |
  ForEach-Object { $_.Matches.Value } | Where-Object { $_ -ne $url } | Sort-Object Length
$Site = if ($aliases) { @($aliases)[0] } else { $url }

Write-Host "`nเสร็จแล้ว! ลิงก์ส่งลูกค้า: $Site" -ForegroundColor Green
Start-Process $Site
Write-Host "หลังบ้าน: $Site/admin"
Write-Host "  อีเมล: $Email"
Write-Host "  รหัสผ่าน: $Pass   (เก็บไว้ใน .vercel\demo-admin.txt)"
Read-Host 'กด Enter เพื่อปิด'

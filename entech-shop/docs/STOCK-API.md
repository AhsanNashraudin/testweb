# ENTECH Website — Stock / ERP Integration API (v1)

เอกสารสำหรับทีมพัฒนาระบบสต็อก (outsource) ที่เชื่อมกับเว็บไซต์ entech-products.com

- **Base URL:** `https://<โดเมนเว็บ>/api/v1` (ช่วงทดสอบ: `https://testweb-azure-chi.vercel.app/api/v1`)
- **รูปแบบ:** JSON (UTF-8) · เวลาเป็น ISO-8601 (UTC) · จำนวนเงินเป็น **บาท จำนวนเต็ม**
- **ยืนยันตัวตน:** ทุกคำขอต้องมี header `Authorization: Bearer <STOCK_API_KEY>`
  - คีย์ตั้งใน Environment Variable `STOCK_API_KEY` ของเว็บ (อย่างน้อย 32 ตัวอักษร) — ส่งให้ทีม outsource ทางช่องทางที่ปลอดภัยเท่านั้น ห้ามใส่ในโค้ดฝั่งเบราว์เซอร์
  - เปลี่ยนคีย์ = แก้ค่า env แล้ว redeploy (คีย์เดิมใช้ไม่ได้ทันที)
  - ไม่ได้ตั้งคีย์ → API ตอบ `503 stock_api_disabled`

## หลักการแบ่งหน้าที่ (Master data)

| ข้อมูล | ใครเป็นเจ้าของ | หมายเหตุ |
|---|---|---|
| SKU, ชื่อรุ่น/ขนาด, ราคาขาย, ราคาส่ง, สต็อก, น้ำหนัก | **ระบบสต็อก** | ส่งเข้าเว็บผ่าน `PUT /items` |
| รูป, คำอธิบาย, ตารางสเปก, หมวด, SEO, การเปิด/ปิดขาย | **หลังบ้านเว็บ** | API ไม่เขียนทับ |
| คำสั่งซื้อ | **เว็บสร้าง** → ระบบสต็อกดึงไป | ระบบสต็อกอัปเดตสถานะ/เลขพัสดุกลับผ่าน `PATCH /orders/{code}` |

**SKU คือกุญแจเชื่อมข้อมูล** — ต้องตรงกันทั้งสองระบบ (ดูรายการ SKU ปัจจุบันในเว็บได้จาก `GET /items`)

## ลำดับการซิงค์ที่แนะนำ (ทุก 1–5 นาที)

1. `GET /orders?cursor=<cursor ล่าสุด>` ดึงคำสั่งซื้อใหม่/ที่เปลี่ยน → บันทึกเข้าระบบสต็อก (ใช้ `code` กันซ้ำ) → เก็บ `nextCursor`
2. `PUT /items` ส่งสต็อกคงเหลือ **หลัง** ตัดยอดคำสั่งซื้อจากข้อ 1 แล้ว

> เว็บตัดสต็อกทันทีเมื่อมีคำสั่งซื้อ (กันขายเกิน) และคืนสต็อกเมื่อยกเลิก ถ้าระบบสต็อกส่งยอดที่ยังไม่หักคำสั่งซื้อเว็บที่ยังไม่ได้ดึง ยอดในเว็บจะสูงเกินจริงชั่วคราว จึงควรดึงคำสั่งซื้อก่อนส่งสต็อกเสมอ

---

## 1. คำสั่งซื้อ

### `GET /orders`
รายการคำสั่งซื้อเรียงจากเก่า → ใหม่ ตามเวลาที่สร้างหรือแก้ไขล่าสุด (คำสั่งซื้อที่ถูกแก้จะกลับมาในรอบถัดไปอีกครั้ง)

| query | ค่า | |
|---|---|---|
| `cursor` | ค่า `nextCursor` จากรอบก่อน | แนะนำใช้ตัวนี้สำหรับซิงค์ต่อเนื่อง (ไม่ซ้ำ ไม่ตกหล่น) |
| `updatedSince` | ISO datetime เช่น `2026-10-01T00:00:00Z` | ใช้ตอนซิงค์ครั้งแรก |
| `status` | ดูตารางสถานะ | กรองสถานะ |
| `limit` | 1–100 (ค่าเริ่มต้น 50) | |

```json
{
  "data": [{
    "code": "ET261021-7KQ2M",
    "status": "paid",
    "createdAt": "2026-10-21T03:15:00.000Z",
    "updatedAt": "2026-10-21T04:02:11.000Z",
    "customer": { "name": "สมชาย ใจดี", "phone": "081-234-5678", "email": "somchai@example.com" },
    "shipping": {
      "method": "delivery", "label": "กรุงเทพฯ ปริมณฑล และสมุทรสาคร (รถกระบะ)",
      "address": "99/1 ม.2 ถ.พระราม 2", "province": "กรุงเทพมหานคร", "postcode": "10150", "weightKg": 42,
      "carrier": "", "trackingNo": "", "trackingUrl": ""
    },
    "taxInvoice": { "name": "บจก. ตัวอย่าง", "taxId": "0105500000000", "branch": "สำนักงานใหญ่", "address": "..." },
    "payment": { "method": "promptpay", "couponCode": "" },
    "amounts": { "subtotal": 5200, "discount": 0, "shippingFee": 2500, "vat": 539, "total": 8239 },
    "note": "",
    "items": [{ "sku": "CW-1000", "productName": "ถังเก็บน้ำ ...", "variantName": "1000 ลิตร", "unitPrice": 2600, "qty": 2, "lineTotal": 5200 }]
  }],
  "nextCursor": "1792814531_42",
  "lastCursor": "1792814531_42"
}
```
`lastCursor` = ตำแหน่งของรายการสุดท้ายในหน้านี้ (มีเสมอเมื่อหน้ามีข้อมูล) — เก็บไว้ส่งเป็น `asOf` ตอน `PUT /items` · `nextCursor = null` แปลว่าดึงครบแล้ว — รอบถัดไปให้ใช้ cursor ตัวสุดท้ายที่ไม่เป็น null · `taxInvoice = null` = ไม่ขอใบกำกับภาษี · `method: "pickup"` = ลูกค้ารับเองที่โรงงาน

### `GET /orders/{code}`
คำสั่งซื้อเดียว รูปแบบเดียวกับด้านบน (`{ "data": {...} }`) · ไม่พบ → `404`

### `PATCH /orders/{code}`
อัปเดตสถานะและข้อมูลติดตามพัสดุ (ส่งเฉพาะช่องที่เปลี่ยน) — ลูกค้าเห็นทันทีในหน้า "ตรวจสอบคำสั่งซื้อ"

```json
{ "status": "shipping", "carrier": "Kerry Express", "trackingNo": "KEX123456789", "trackingUrl": "https://th.kerryexpress.com/th/track/?track=KEX123456789" }
```
- `trackingUrl` ต้องเป็น `https://` หรือ `""` (ลบ) · `carrier`, `trackingNo` ไม่เกิน 80 ตัวอักษร
- เปลี่ยนเป็น `cancelled` → เว็บ **คืนสต็อกอัตโนมัติ** (ครั้งเดียว) · เปลี่ยนจาก `cancelled` กลับ → ตัดสต็อกอีกครั้ง (สต็อกไม่พอ → `409`)
- ตอบกลับคำสั่งซื้อฉบับล่าสุด

| status | ความหมาย |
|---|---|
| `pending_payment` | รอชำระเงิน |
| `paid` | ชำระแล้ว |
| `preparing` | กำลังเตรียมสินค้า |
| `shipping` | กำลังจัดส่ง |
| `completed` | สำเร็จ |
| `cancelled` | ยกเลิก |

> เว็บยังไม่ได้เชื่อม payment gateway: การยืนยันชำระเงินทำโดยแอดมิน (หลังบ้านเว็บ) หรือระบบสต็อกส่ง `status: "paid"` มาก็ได้

---

## 2. สินค้า (Master item)

### `GET /items`
SKU ทั้งหมดในเว็บ ใช้กระทบยอด
```json
{ "data": [{ "sku": "CW-1000", "variantName": "1000 ลิตร", "price": 2600, "bulkPrice": 2400, "bulkMinQty": 5, "stock": 12, "weightKg": 21,
             "productCode": "tank-grand-stone", "productName": "ถังเก็บน้ำ GRAND STONE", "category": "water-tanks", "active": true }] }
```

### `PUT /items`
ส่งได้ครั้งละไม่เกิน 500 รายการ (ส่งทั้งหมดหรือเฉพาะที่เปลี่ยนก็ได้)

```json
{ "items": [
  { "sku": "CW-1000", "stock": 37, "price": 2700 },
  { "sku": "CW-1500", "variantName": "1500 ลิตร", "price": 3490, "stock": 4, "weightKg": 28,
    "product": { "code": "tank-grand-stone" } },
  { "sku": "NT-500", "variantName": "500 ลิตร", "price": 1990, "stock": 10,
    "product": { "code": "tank-new-model", "name": "ถังเก็บน้ำรุ่นใหม่", "category": "water-tanks" } }
] }
```

| ช่อง | ชนิด | |
|---|---|---|
| `sku` | string (บังคับ) | |
| `variantName` | string | ชื่อรุ่น/ขนาดที่ลูกค้าเห็น |
| `price` | int ≥ 0 | ราคาขาย (`0` = "สอบถามราคา" สั่งออนไลน์ไม่ได้) · ราคาก่อนลดคำนวณอัตโนมัติตามการตั้งค่าเว็บ |
| `bulkPrice`, `bulkMinQty` | int ≥ 0 | ราคาส่งเมื่อซื้อตั้งแต่ `bulkMinQty` ชิ้น (`0` = ไม่มี) |
| `stock` | int ≥ 0 | สต็อกพร้อมขาย |
| `weightKg` | number | ใช้คำนวณค่าส่ง |
| `product.code` | slug `a-z 0-9 -` | กลุ่มสินค้า (1 สินค้ามีหลาย SKU) — **บังคับเมื่อเป็น SKU ใหม่** |
| `product.name`, `product.category` | string | บังคับเมื่อเป็น **สินค้าใหม่** (category = slug หมวดในเว็บ เช่น `water-tanks`, `septic-tanks`, `grease-traps`, `fiberglass-doors`, `wall-bins`, `fiberglass-water-tanks`, `planters`) |

- SKU ที่มีอยู่แล้ว → อัปเดตเฉพาะช่องที่ส่งมา
- SKU ใหม่ → ต้องมี `variantName`, `price`, `product.code` · ถ้า `product.code` ยังไม่มีในเว็บ ระบบสร้างสินค้าใหม่แบบ **ซ่อนไว้** จนแอดมินใส่รูป/รายละเอียดแล้วเปิดขาย
- เลิกขาย SKU: ส่ง `stock: 0` (แอดมินซ่อนทั้งสินค้าได้ในหลังบ้าน)

ผลลัพธ์รายรายการ:
```json
{ "data": [{ "sku": "CW-1000", "result": "updated" }, { "sku": "NT-500", "result": "created" },
           { "sku": "XX-1", "result": "error", "message": "SKU ใหม่ต้องส่ง product.code ..." }],
  "summary": { "total": 3, "errors": 1 } }
```
HTTP `200` = สำเร็จทั้งหมด · `207` = สำเร็จบางรายการ (ดู `result`) · `400` = ผิดทั้งหมด/รูปแบบผิด

---

## Error

| HTTP | `error` | |
|---|---|---|
| 400 | `invalid_request` + `issues[]` | รูปแบบข้อมูลไม่ถูกต้อง (`issues[].path` บอกช่องที่ผิด) |
| 401 | `unauthorized` | ไม่มี/คีย์ผิด |
| 404 | `not_found` | ไม่พบคำสั่งซื้อ |
| 409 | ข้อความ | สต็อกไม่พอสำหรับเปิดคำสั่งซื้อที่ยกเลิกแล้ว |
| 503 | `stock_api_disabled` | เว็บยังไม่ได้ตั้ง `STOCK_API_KEY` |

ขนาดคำขอสูงสุด: `PUT /items` 1 MB · `PATCH /orders` 10 KB

## ตัวอย่าง (curl)
```bash
KEY=...   # STOCK_API_KEY
BASE=https://testweb-azure-chi.vercel.app/api/v1
curl -H "Authorization: Bearer $KEY" "$BASE/orders?updatedSince=2026-10-01T00:00:00Z&limit=20"
curl -X PATCH -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
     -d '{"status":"shipping","carrier":"Kerry Express","trackingNo":"KEX123"}' "$BASE/orders/ET261021-7KQ2M"
curl -X PUT -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
     -d '{"items":[{"sku":"CW-1000","stock":37}]}' "$BASE/items"
```

## `asOf` ใน `PUT /items` (กันการเขียนทับยอดที่เพิ่งขาย)

ส่ง `"asOf": "<lastCursor ล่าสุดที่ดึงแล้ว>"` มาพร้อม `items` ได้ (ไม่บังคับ) — เว็บจะตั้งสต็อกเป็น `stock − จำนวนที่ขายในคำสั่งซื้อที่สร้างหลังจุดนั้น (ไม่นับที่ยกเลิก)`
ในคำสั่ง UPDATE เดียว ทำให้ออเดอร์ที่เข้ามาระหว่างระบบสต็อกคำนวณยอดไม่ถูกเขียนทับ · ไม่ส่ง `asOf` = ตั้งค่าตรงตามที่ส่ง (พฤติกรรมเดิม)

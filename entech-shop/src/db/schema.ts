import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const now = () => sql`(unixepoch())`;

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  image: text('image').notNull().default(''),
  sort: integer('sort').notNull().default(0),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  brand: text('brand').notNull().default('ENTECH'),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  shortDesc: text('short_desc').notNull().default(''),
  description: text('description').notNull().default(''),
  image: text('image').notNull().default(''),
  badge: text('badge').notNull().default(''),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  seoTitle: text('seo_title').notNull().default(''),
  seoDesc: text('seo_desc').notNull().default(''),
  // ตารางสเปก: บรรทัดแรก = หัวตาราง, คั่นคอลัมน์ด้วย |  (แก้ได้ในหลังบ้าน)
  specs: text('specs').notNull().default(''),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now()),
});

export const variants = sqliteTable('variants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  price: integer('price').notNull(),
  compareAtPrice: integer('compare_at_price').notNull().default(0),
  // ราคาขั้นบันได: ซื้อตั้งแต่ bulkMinQty ชิ้นขึ้นไป ใช้ bulkPrice (0 = ไม่มี) · price = 0 คือ "สอบถามราคา"
  bulkPrice: integer('bulk_price').notNull().default(0),
  bulkMinQty: integer('bulk_min_qty').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  weightKg: real('weight_kg').notNull().default(0),
  sort: integer('sort').notNull().default(0),
});

export const shippingZones = sqliteTable('shipping_zones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  method: text('method', { enum: ['flat', 'weight'] }).notNull().default('flat'),
  baseFee: integer('base_fee').notNull().default(0),
  perKgFee: integer('per_kg_fee').notNull().default(0),
  includedKg: real('included_kg').notNull().default(0),
  freeOver: integer('free_over').notNull().default(0),
  etaText: text('eta_text').notNull().default(''),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isFallback: integer('is_fallback', { mode: 'boolean' }).notNull().default(false),
  sort: integer('sort').notNull().default(0),
});

/** หนึ่งจังหวัดอยู่ได้แค่โซนเดียว — บังคับด้วย primary key */
export const zoneProvinces = sqliteTable('zone_provinces', {
  province: text('province').primaryKey(),
  zoneId: integer('zone_id').notNull().references(() => shippingZones.id, { onDelete: 'cascade' }),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull().default(''),
  body: text('body').notNull().default(''),
  // article = บทความความรู้ · csr = กิจกรรมเพื่อสังคม (แสดงคนละหน้า)
  kind: text('kind', { enum: ['article', 'csr'] }).notNull().default('article'),
  image: text('image').notNull().default(''), // รูปปก (ไม่บังคับ)
  seoTitle: text('seo_title').notNull().default(''),
  seoDesc: text('seo_desc').notNull().default(''),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(now()),
});

export const coupons = sqliteTable('coupons', {
  code: text('code').primaryKey(),
  type: text('type', { enum: ['fixed', 'percent'] }).notNull(),
  value: integer('value').notNull(),
  minSubtotal: integer('min_subtotal').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  accessKey: text('access_key').notNull(),
  status: text('status', { enum: ['pending_payment', 'paid', 'preparing', 'shipping', 'completed', 'cancelled'] })
    .notNull()
    .default('pending_payment'),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull().default(''),
  province: text('province').notNull(),
  postcode: text('postcode').notNull().default(''),
  taxName: text('tax_name').notNull().default(''),
  taxId: text('tax_id').notNull().default(''),
  taxBranch: text('tax_branch').notNull().default(''),
  taxAddress: text('tax_address').notNull().default(''),
  note: text('note').notNull().default(''),
  shippingOption: text('shipping_option').notNull(),
  shippingLabel: text('shipping_label').notNull(),
  paymentMethod: text('payment_method', { enum: ['promptpay', 'transfer'] }).notNull(),
  couponCode: text('coupon_code').notNull().default(''),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  shippingFee: integer('shipping_fee').notNull(),
  vat: integer('vat').notNull().default(0), // VAT 7% ที่บวกเพิ่ม (กรณีราคาสินค้ายังไม่รวม VAT)
  total: integer('total').notNull(),
  weightKg: real('weight_kg').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now()),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  variantId: integer('variant_id').notNull(),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').notNull(),
  sku: text('sku').notNull(),
  unitPrice: integer('unit_price').notNull(),
  qty: integer('qty').notNull(),
});

export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  phone: text('phone').notNull(),
  email: text('email').notNull().default(''),
  topic: text('topic').notNull(),
  province: text('province').notNull().default(''),
  detail: text('detail').notNull().default(''),
  status: text('status', { enum: ['new', 'in_progress', 'sent', 'won', 'lost'] }).notNull().default('new'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now()),
});

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
});



/** รูปที่อัปโหลดจากหลังบ้าน (เก็บในฐานข้อมูล ใช้ได้ทั้งในเครื่องและบน Vercel โดยไม่ต้องตั้งค่าที่เก็บไฟล์เพิ่ม)
 *  ย่อขนาดในเบราว์เซอร์ก่อนอัปโหลด → ไฟล์ละไม่กี่ร้อย KB · เรียกดูที่ /media/<id> */
export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mime: text('mime').notNull(),
  data: text('data').notNull(), // base64
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now()),
});

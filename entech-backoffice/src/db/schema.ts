/** ฐานข้อมูลหลังบ้าน ENTECH (แยกจากเว็บไซต์) · เว็บเชื่อมผ่าน Stock API v1 โดยใช้ SKU / เลขออเดอร์เป็นกุญแจ */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
});

export const settings = sqliteTable('settings', { key: text('key').primaryKey(), value: text('value').notNull() });

/** สินค้า (SKU) — หลังบ้านเป็นเจ้าของราคาและสต็อก แล้วส่งให้เว็บ · stock = พร้อมขาย (หักออเดอร์ที่จองแล้ว) */
export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  productCode: text('product_code').notNull().default(''),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').notNull().default(''),
  category: text('category').notNull().default(''),
  price: integer('price').notNull().default(0),
  bulkPrice: integer('bulk_price').notNull().default(0),
  bulkMinQty: integer('bulk_min_qty').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  weightKg: real('weight_kg').notNull().default(0),
  reorderPoint: integer('reorder_point').notNull().default(0),
  pushPending: integer('push_pending', { mode: 'boolean' }).notNull().default(false), // ต้องส่งสต็อก/ราคาให้เว็บ
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  channel: text('channel', { enum: ['web', 'sales'] }).notNull(),
  status: text('status', { enum: ['pending_payment', 'paid', 'preparing', 'shipping', 'completed', 'cancelled'] }).notNull(), // สถานะที่ลูกค้าเห็น
  statusPending: integer('status_pending', { mode: 'boolean' }).notNull().default(false), // ต้อง PATCH สถานะ/เลขพัสดุกลับเว็บ
  stage: text('stage', { enum: ['received', 'approval', 'production', 'packing', 'billing', 'payment', 'done', 'cancelled'] }).notNull().default('received'),
  stageAt: integer('stage_at').notNull(),
  assignee: text('assignee').notNull().default(''),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  address: text('address').notNull().default(''),
  province: text('province').notNull().default(''),
  postcode: text('postcode').notNull().default(''),
  shippingLabel: text('shipping_label').notNull().default(''),
  taxName: text('tax_name').notNull().default(''),
  taxId: text('tax_id').notNull().default(''),
  taxAddress: text('tax_address').notNull().default(''),
  note: text('note').notNull().default(''),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  shippingFee: integer('shipping_fee').notNull().default(0),
  vat: integer('vat').notNull().default(0),
  total: integer('total').notNull(),
  creditDays: integer('credit_days').notNull().default(0),
  paidAt: integer('paid_at').notNull().default(0), // ลูกค้าชำระแล้วเมื่อไร (0 = ยังไม่ชำระ)
  carrier: text('carrier').notNull().default(''),
  trackingNo: text('tracking_no').notNull().default(''),
  trackingUrl: text('tracking_url').notNull().default(''),
  createdAt: integer('created_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  itemId: integer('item_id'), // null = SKU ที่หลังบ้านยังไม่มี
  sku: text('sku').notNull(),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').notNull().default(''),
  unitPrice: integer('unit_price').notNull(),
  qty: integer('qty').notNull(),
});

/** ประวัติทุกการเปลี่ยนขั้นตอนของออเดอร์ (ใคร ทำอะไร เมื่อไหร่) */
export const orderEvents = sqliteTable('order_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  stage: text('stage').notNull(),
  note: text('note').notNull(),
  by: text('by').notNull(),
  at: integer('at').notNull(),
});

export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  province: text('province').notNull().default(''),
  taxId: text('tax_id').notNull().default(''),
  address: text('address').notNull().default(''),
  topic: text('topic').notNull().default(''),
  status: text('status', { enum: ['draft', 'sent', 'won', 'lost'] }).notNull().default('draft'),
  discountPct: real('discount_pct').notNull().default(0),
  creditDays: integer('credit_days').notNull().default(0),
  validDays: integer('valid_days').notNull().default(30),
  customerNote: text('customer_note').notNull().default(''),
  salesperson: text('salesperson').notNull().default(''),
  orderId: integer('order_id'),
  createdAt: integer('created_at').notNull(),
});

export const quoteItems = sqliteTable('quote_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteId: integer('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  itemId: integer('item_id').notNull().references(() => items.id),
  qty: integer('qty').notNull(),
  unitPrice: integer('unit_price').notNull(),
});

/** วัตถุดิบ (ผง LLDPE สีผสม ฝาถัง อุปกรณ์) */
export const materials = sqliteTable('materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  unit: text('unit').notNull().default('กก.'),
  stock: real('stock').notNull().default(0),
  reorderPoint: real('reorder_point').notNull().default(0),
  cost: real('cost').notNull().default(0),
});

/** สูตรการผลิต: ถัง 1 ใบใช้วัตถุดิบอะไรเท่าไหร่ */
export const bom = sqliteTable('bom', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemId: integer('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  materialId: integer('material_id').notNull().references(() => materials.id),
  qtyPer: real('qty_per').notNull(),
});

export const productionOrders = sqliteTable('production_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  itemId: integer('item_id').notNull().references(() => items.id),
  qty: integer('qty').notNull(),
  status: text('status', { enum: ['waiting', 'queued', 'in_progress', 'qc', 'done', 'cancelled'] }).notNull().default('queued'),
  orderId: integer('order_id'), // null = ผลิตเก็บสต็อก
  line: text('line').notNull().default(''),
  assignee: text('assignee').notNull().default(''),
  goodQty: integer('good_qty').notNull().default(0),
  rejectQty: integer('reject_qty').notNull().default(0),
  dueAt: integer('due_at').notNull(),
  note: text('note').notNull().default(''),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const stockMoves = sqliteTable('stock_moves', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind', { enum: ['item', 'material'] }).notNull(),
  itemId: integer('item_id').notNull(),
  qty: real('qty').notNull(),
  reason: text('reason').notNull(),
  ref: text('ref').notNull().default(''),
  by: text('by').notNull(),
  at: integer('at').notNull(),
});

export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  kind: text('kind', { enum: ['tax_invoice', 'credit_note'] }).notNull().default('tax_invoice'),
  orderId: integer('order_id').notNull().references(() => orders.id),
  buyerName: text('buyer_name').notNull(),
  buyerTaxId: text('buyer_tax_id').notNull().default(''),
  buyerAddress: text('buyer_address').notNull().default(''),
  buyerEmail: text('buyer_email').notNull().default(''),
  subtotal: integer('subtotal').notNull(),
  vat: integer('vat').notNull(),
  total: integer('total').notNull(),
  issuedAt: integer('issued_at').notNull(),
  dueAt: integer('due_at').notNull(),
  paidAt: integer('paid_at').notNull().default(0),
  receiptCode: text('receipt_code').notNull().default(''),
  etaxStatus: text('etax_status', { enum: ['pending', 'sent', 'certified', 'failed'] }).notNull().default('pending'),
  etaxNote: text('etax_note').notNull().default(''),
});

import Database from 'better-sqlite3';
import path from 'path';
import { seedDatabase } from './seed.js';

const DB_PATH = path.join(process.cwd(), 'medico.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      mrp REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      stock_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      mfd TEXT,
      expiry_date TEXT,
      batch_no TEXT,
      is_active BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'staff'
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      status TEXT DEFAULT 'In Progress',
      cancelled_by TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      staff_id TEXT DEFAULT NULL,
      prescription_image TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      medicine_id INTEGER NOT NULL,
      medicine_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      batch_id INTEGER,
      mrp REAL NOT NULL,
      discount_percent REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(order_id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT UNIQUE NOT NULL,
      order_id TEXT UNIQUE NOT NULL,
      subtotal REAL NOT NULL,
      total_discount REAL NOT NULL,
      final_amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    );

    CREATE TABLE IF NOT EXISTS order_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      action TEXT NOT NULL,
      performed_by TEXT DEFAULT 'system',
      timestamp TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  // Migration: Add new columns to medicines table if they don't exist
  const alterColumns = [
    { name: 'stock_quantity', type: 'INTEGER DEFAULT 0' },
    { name: 'low_stock_threshold', type: 'INTEGER DEFAULT 10' },
    { name: 'mfd', type: 'TEXT' },
    { name: 'expiry_date', type: 'TEXT' },
    { name: 'batch_no', type: 'TEXT' },
    { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' }
  ];

  alterColumns.forEach(col => {
    try {
      db.exec(`ALTER TABLE medicines ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Column probably already exists
    }
  });

  // Ensure batches table exists and has mfd_date
  db.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      mrp REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      expiry_date TEXT NOT NULL,
      mfd_date TEXT,
      stock INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      quantity_added INTEGER NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );
  `);

  try {
    db.exec(`ALTER TABLE batches ADD COLUMN mfd_date TEXT`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE batches ADD COLUMN discount_percent REAL DEFAULT 0`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE batches ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE order_items ADD COLUMN batch_id INTEGER REFERENCES batches(id)`);
  } catch (e) {}

  // Now create indexes after ensuring columns exist
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
    CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
    CREATE INDEX IF NOT EXISTS idx_medicines_stock_quantity ON medicines(stock_quantity);
    CREATE INDEX IF NOT EXISTS idx_medicines_batch_no ON medicines(batch_no);

    CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
    CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_bills_order_id ON bills(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
  `);

  try {
    db.exec(`ALTER TABLE orders ADD COLUMN prescription_image TEXT DEFAULT NULL`);
  } catch (e) {
    // column exists
  }

  // Automatically seed if empty
  seedDatabase(db);
}

// ─── Helper: Generate Order ID ───
export function generateOrderId() {
  const prefix = 'MED';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ─── Helper: Generate Bill Number ───
export function generateBillNumber() {
  const prefix = 'BILL';
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const datePattern = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}%`;
  const seq = db.prepare('SELECT COUNT(*) as count FROM bills WHERE created_at LIKE ?').get(datePattern).count + 1;
  return `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`;
}

export default getDb;

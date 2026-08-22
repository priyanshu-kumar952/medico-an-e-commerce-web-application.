import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'medico.db');
const db = new Database(DB_PATH);

console.log('Starting migration...');

// Based on actual schema: id, medicine_id, batch_no, mrp, expiry_date, stock
// 1. Ensure table exists with correct schema if it didn't
db.exec(`
  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id INTEGER NOT NULL,
    batch_no TEXT NOT NULL,
    mrp REAL NOT NULL,
    expiry_date TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
  );
`);
console.log('Checked batches table.');

// 2. Migrate existing medicine stock into batches
const medicines = db.prepare('SELECT id, batch_no, mrp, expiry_date, stock_quantity FROM medicines').all();
const insertBatch = db.prepare(`
  INSERT INTO batches (medicine_id, batch_no, mrp, expiry_date, stock)
  VALUES (?, ?, ?, ?, ?)
`);

let migratedCount = 0;
const existingBatchesCheck = db.prepare('SELECT COUNT(*) as count FROM batches').get();
if (existingBatchesCheck.count === 0) {
    db.transaction(() => {
        for (const med of medicines) {
            // Only migrate if there is some stock or batch info
            if (med.stock_quantity > 0 || med.batch_no || med.expiry_date) {
                insertBatch.run(
                    med.id, 
                    med.batch_no || 'INITIAL-B1', 
                    med.mrp, 
                    med.expiry_date || '2030-12-31', // Not null constraint
                    med.stock_quantity || 0
                );
                migratedCount++;
            }
        }
    })();
    console.log(`Migrated ${migratedCount} medicines into initial batches.`);
} else {
    console.log(`Batches table already has ${existingBatchesCheck.count} rows, skipping initial migration.`);
}

// 3. Update order_items table to have batch_id
try {
  db.exec('ALTER TABLE order_items ADD COLUMN batch_id INTEGER REFERENCES batches(id)');
  console.log('Added batch_id to order_items.');
} catch (e) {
  // column might already exist
  console.log('batch_id column might already exist in order_items.');
}

// 4. Update orders table to have packed_at and completed_at
try {
  db.exec('ALTER TABLE orders ADD COLUMN packed_at TEXT');
  console.log('Added packed_at to orders.');
} catch(e) {}
try {
  db.exec('ALTER TABLE orders ADD COLUMN completed_at TEXT');
  console.log('Added completed_at to orders.');
} catch(e) {}

// 5. Update existing orders to new statuses if needed
// Update "In Progress" to "PREPARING", "Pending" to "PLACED" (Pending wasn't strictly in DB, but just in case)
db.exec(`
  UPDATE orders SET status = 'PREPARING' WHERE status = 'In Progress';
  UPDATE orders SET status = 'PLACED' WHERE status = 'Pending';
  UPDATE orders SET status = 'PACKED' WHERE status = 'Packed';
  UPDATE orders SET status = 'COMPLETED' WHERE status = 'Completed';
  UPDATE orders SET status = 'CANCELLED' WHERE status = 'Cancelled';
`);
console.log('Updated order statuses to strict format.');

// 6. Create Indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
  CREATE INDEX IF NOT EXISTS idx_batches_medicine ON batches(medicine_id);
`);
console.log('Created new indexes.');

// 7. Update staff roles (ensure defaults)
try {
  db.exec(`UPDATE staff SET role = 'owner' WHERE staff_id = 'admin';`);
  console.log('Set default owner role.');
} catch(e) {}

console.log('Migration completed successfully.');

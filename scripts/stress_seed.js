const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'medico.db');
const db = new Database(DB_PATH);

// Helper: Generate Order ID
function generateOrderId() {
    const prefix = 'MED';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// Helper: Generate Bill Number
function generateBillNumber(seq) {
    const prefix = 'BILL';
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`;
}

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function stressSeed() {
    console.log('🚀 Starting Stress Seeding...');

    // 1. Get medicines pool
    const medicines = db.prepare('SELECT * FROM medicines').all();
    if (medicines.length === 0) {
        console.error('❌ No medicines found in database. Please run initial seed first.');
        process.exit(1);
    }

    const today = new Date();
    const numOrders = 500;
    const daysBack = 120;

    const insertOrder = db.prepare(`
        INSERT INTO orders (order_id, customer_name, phone, address, status, created_at, updated_at, staff_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOrderItem = db.prepare(`
        INSERT INTO order_items (order_id, medicine_id, medicine_name, quantity, mrp, discount_percent, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertBill = db.prepare(`
        INSERT INTO bills (bill_number, order_id, subtotal, total_discount, final_amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
        for (let i = 0; i < numOrders; i++) {
            const randomDaysAgo = Math.floor(Math.random() * daysBack);
            const date = new Date(today);
            date.setDate(today.getDate() - randomDaysAgo);
            
            // Randomize time of day
            date.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60));

            const dateStr = date.toISOString().replace('T', ' ').substring(0, 19);
            const orderId = generateOrderId() + i; // Adding i to ensure uniqueness in fast loop
            
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const itemsCount = Math.floor(Math.random() * (isWeekend ? 5 : 3)) + 1;
            
            let subtotal = 0;
            let totalDiscount = 0;

            // Insert Order
            insertOrder.run(
                orderId,
                `Test Customer ${i}`,
                `98765${String(i).padStart(5, '0')}`,
                'Gardanibagh, Patna',
                'Completed',
                dateStr,
                dateStr,
                'STAFF001'
            );

            // Insert Order Items
            for (let j = 0; j < itemsCount; j++) {
                const med = randomItem(medicines);
                const quantity = Math.floor(Math.random() * 3) + 1;
                const lineTotal = (med.mrp * (1 - med.discount_percent / 100)) * quantity;
                
                subtotal += med.mrp * quantity;
                totalDiscount += (med.mrp * (med.discount_percent / 100)) * quantity;

                insertOrderItem.run(
                    orderId,
                    med.id,
                    med.name,
                    quantity,
                    med.mrp,
                    med.discount_percent,
                    lineTotal
                );
            }

            const finalAmount = subtotal - totalDiscount;

            // Insert Bill
            insertBill.run(
                `BILL-SEED-${i}-${Date.now()}`,
                orderId,
                subtotal,
                totalDiscount,
                finalAmount,
                dateStr
            );
        }
    });

    try {
        transaction();
        console.log(`✅ Successfully seeded ${numOrders} orders with bills.`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

stressSeed();

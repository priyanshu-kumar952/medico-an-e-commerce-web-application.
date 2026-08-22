import getDb, { generateBillNumber } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const { staff_id, items } = body;

        if (!items || !items.length) {
            return NextResponse.json({ error: 'Items required for packing' }, { status: 400 });
        }

        const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status !== 'PLACED') {
            return NextResponse.json({ error: 'Only NEW orders can be packed' }, { status: 400 });
        }

        const billNumber = generateBillNumber();

        const packOrder = db.transaction(() => {
            // Check stock from batches
            for (const item of items) {
                // item.medicine_id here represents the selected batch ID from the client dropdown
                const batch = db.prepare(`
                    SELECT b.*, m.name as medicine_name 
                    FROM batches b
                    JOIN medicines m ON b.medicine_id = m.id
                    WHERE b.id = ?
                `).get(item.medicine_id);

                if (!batch) {
                    throw new Error(`Batch not found: ${item.medicine_id}`);
                }
                const qty = parseInt(item.quantity);
                if (batch.stock < qty) { // 'stock' column in batches table
                    throw new Error(`Insufficient stock for ${batch.medicine_name} (Batch ${batch.batch_no}). Available: ${batch.stock}, Requested: ${qty}`);
                }
            }

            let subtotal = 0;
            let totalDiscount = 0;

            const updateItem = db.prepare(
                'UPDATE order_items SET medicine_id = ?, batch_id = ?, mrp = ?, discount_percent = ?, line_total = ? WHERE order_id = ? AND medicine_name = ?'
            );
            const updateStock = db.prepare(
                'UPDATE batches SET stock = stock - ? WHERE id = ?'
            );

            for (const item of items) {
                // item.medicine_id is the selected batch ID
                const batch = db.prepare(`
                    SELECT b.*, m.discount_percent 
                    FROM batches b 
                    JOIN medicines m ON b.medicine_id = m.id 
                    WHERE b.id = ?
                `).get(item.medicine_id);

                const qty = parseInt(item.quantity);
                const gross = batch.mrp * qty;
                const discountAmount = gross * ((batch.discount_percent || 0) / 100);
                const lineTotal = gross - discountAmount;

                // Update order item with batch pricing and ID
                updateItem.run(batch.medicine_id, batch.id, batch.mrp, batch.discount_percent || 0, lineTotal, id, item.medicine_name);
                
                // Deduct from batch
                updateStock.run(qty, batch.id);

                subtotal += gross;
                totalDiscount += discountAmount;
            }

            const finalAmount = subtotal - totalDiscount;

            // Create bill
            db.prepare(
                'INSERT INTO bills (bill_number, order_id, subtotal, total_discount, final_amount) VALUES (?, ?, ?, ?, ?)'
            ).run(billNumber, id, subtotal, totalDiscount, finalAmount);

            // Update order status to PACKED and set packed_at timestamp
            db.prepare(
                "UPDATE orders SET status = 'PACKED', staff_id = ?, updated_at = datetime('now', 'localtime'), packed_at = datetime('now', 'localtime') WHERE order_id = ?"
            ).run(staff_id || null, id);

            // Log
            db.prepare(
                'INSERT INTO order_logs (order_id, action, performed_by) VALUES (?, ?, ?)'
            ).run(id, 'Order packed, priced, and bill generated', staff_id || 'system');

            return { success: true };
        });

        packOrder();

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);
        const updatedItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
        const bill = db.prepare('SELECT * FROM bills WHERE order_id = ?').get(id);

        return NextResponse.json({ order: updatedOrder, items: updatedItems, bill });
    } catch (error) {
        console.error('Packing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

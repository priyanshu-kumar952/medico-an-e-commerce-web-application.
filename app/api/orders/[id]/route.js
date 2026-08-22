import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;

        const order = db.prepare(`
      SELECT o.*, b.bill_number, b.final_amount, b.subtotal, b.total_discount, b.created_at as bill_date
      FROM orders o
      LEFT JOIN bills b ON o.order_id = b.order_id
      WHERE o.order_id = ? OR b.bill_number = ?
    `).get(id, id);

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
        const logs = db.prepare('SELECT * FROM order_logs WHERE order_id = ? ORDER BY timestamp DESC').all(id);

        return NextResponse.json({ order, items, logs });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();
        const { status, staff_id, cancelled_by, reason } = body;

        // Verify session for staff actions (not customer cancellations)
        if (cancelled_by !== 'customer') {
            const session = await getSession();
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Handle cancellation
        if (status === 'CANCELLED') {
            if (!['PLACED', 'PACKED'].includes(order.status)) {
                return NextResponse.json({ error: 'Order is fully completed or already cancelled' }, { status: 400 });
            }

            // Staff cannot cancel PACKED orders
            if (cancelled_by !== 'customer' && order.status === 'PACKED') {
                return NextResponse.json({ error: 'Staff cannot cancel an order once it is PACKED.' }, { status: 400 });
            }

            // Restore inventory if items were already packed
            if (['PACKED'].includes(order.status)) {
                db.transaction(() => {
                    const items = db.prepare('SELECT batch_id, quantity FROM order_items WHERE order_id = ?').all(id);
                    const restoreStock = db.prepare('UPDATE batches SET stock = stock + ? WHERE id = ?');
                    for (const item of items) {
                        if (item.batch_id) {
                            restoreStock.run(item.quantity, item.batch_id);
                        }
                    }
                    
                    db.prepare(
                        "UPDATE orders SET status = 'CANCELLED', cancelled_by = ?, updated_at = datetime('now', 'localtime') WHERE order_id = ?"
                    ).run(cancelled_by || 'unknown', id);

                    const performer = cancelled_by === 'customer' ? 'Customer' : (staff_id || cancelled_by || 'system');
                    const logAction = reason ? `Order cancelled & stock restored. Reason: ${reason}` : 'Order cancelled & stock restored';
                    db.prepare(
                        'INSERT INTO order_logs (order_id, action, performed_by) VALUES (?, ?, ?)'
                    ).run(id, logAction, performer);
                })();
            } else {
                // Not packed yet, just cancel
                db.prepare(
                    "UPDATE orders SET status = 'CANCELLED', cancelled_by = ?, updated_at = datetime('now', 'localtime') WHERE order_id = ?"
                ).run(cancelled_by || 'unknown', id);

                const performer = cancelled_by === 'customer' ? 'Customer' : (staff_id || cancelled_by || 'system');
                const logAction = reason ? `Order cancelled. Reason: ${reason}` : 'Order cancelled';
                db.prepare(
                    'INSERT INTO order_logs (order_id, action, performed_by) VALUES (?, ?, ?)'
                ).run(id, logAction, performer);
            }

            const updatedOrder = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);
            return NextResponse.json({ order: updatedOrder });
        }

        // Normal status transitions
        const validTransitions = {
            'PLACED': ['PACKED'],
            'PACKED': ['COMPLETED']
        };

        if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
            return NextResponse.json({ error: `Invalid status transition from "${order.status}" to "${status}"` }, { status: 400 });
        }

        let updateQuery = "UPDATE orders SET status = ?, staff_id = ?, updated_at = datetime('now', 'localtime') WHERE order_id = ?";
        if (status === 'COMPLETED') {
            updateQuery = "UPDATE orders SET status = ?, staff_id = ?, updated_at = datetime('now', 'localtime'), completed_at = datetime('now', 'localtime') WHERE order_id = ?";
        }

        db.prepare(updateQuery).run(status, staff_id || null, id);

        db.prepare(
            'INSERT INTO order_logs (order_id, action, performed_by) VALUES (?, ?, ?)'
        ).run(id, `Status changed to "${status}"`, staff_id || 'system');

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);

        return NextResponse.json({ order: updatedOrder });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'staff')) {
            return NextResponse.json({ error: 'Unauthorized. Access required.' }, { status: 401 });
        }

        const { id } = await params;
        const db = getDb();
        const body = await request.json();
        const { type, quantity, reason, is_edit, batch_no, mrp, mfd_date, expiry_date, stock, discount_percent } = body;

        const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
        if (!batch) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }

        if (is_edit) {
            db.transaction(() => {
                const updatedStock = stock !== undefined ? parseInt(stock) : batch.stock;
                if (updatedStock < 0) {
                    throw new Error('Stock cannot be negative');
                }

                // Check if used in orders
                const isUsed = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE batch_id = ?').get(id).count > 0;
                
                if (isUsed && batch_no && batch_no !== batch.batch_no) {
                    throw new Error('Cannot change Batch Number because it is already used in orders.');
                }

                db.prepare(`
                    UPDATE batches 
                    SET batch_no = ?, mrp = ?, expiry_date = ?, mfd_date = ?, stock = ?, discount_percent = ?
                    WHERE id = ?
                `).run(
                    batch_no || batch.batch_no,
                    parseFloat(mrp) || batch.mrp,
                    expiry_date || batch.expiry_date,
                    mfd_date || batch.mfd_date,
                    updatedStock,
                    discount_percent !== undefined ? parseFloat(discount_percent) : batch.discount_percent,
                    id
                );

                // Log full edit
                db.prepare(`
                    INSERT INTO inventory_logs (batch_id, change_type, quantity_added, reason)
                    VALUES (?, 'EDIT_DETAILS', ?, ?)
                `).run(id, updatedStock - batch.stock, `Details updated by ${session.name || 'Admin'}. ${reason || ''}`);
            })();
        } else {
            if (!type || !quantity) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const qty = parseInt(quantity);
            if (qty <= 0) {
                return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
            }

            db.transaction(() => {
                if (type === 'add') {
                    db.prepare('UPDATE batches SET stock = stock + ? WHERE id = ?').run(qty, id);
                    
                    db.prepare(`
                        INSERT INTO inventory_logs (batch_id, change_type, quantity_added, reason)
                        VALUES (?, 'ADD_STOCK', ?, ?)
                    `).run(id, qty, `Added by ${session.name || 'Admin'}. ${reason || ''}`);
                } else if (type === 'remove') {
                    if (batch.stock < qty) {
                        throw new Error(`Cannot deduct ${qty}. Only ${batch.stock} left in batch.`);
                    }
                    db.prepare('UPDATE batches SET stock = stock - ? WHERE id = ?').run(qty, id);

                    db.prepare(`
                        INSERT INTO inventory_logs (batch_id, change_type, quantity_added, reason)
                        VALUES (?, 'REMOVE_STOCK', ?, ?)
                    `).run(id, -qty, `Removed by ${session.name || 'Admin'}. ${reason || ''}`);
                } else {
                    throw new Error('Invalid adjustment type');
                }
            })();
        }

        const updatedBatch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);

        return NextResponse.json({ success: true, batch: updatedBatch });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'staff')) {
            return NextResponse.json({ error: 'Unauthorized. Access required.' }, { status: 401 });
        }

        const { id } = await params;
        const db = getDb();

        const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
        if (!batch) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }

        db.transaction(() => {
            // Ensure foreign keys are active
            db.pragma('foreign_keys = ON');

            // 1. Delete order items for this batch
            db.prepare('DELETE FROM order_items WHERE batch_id = ?').run(id);

            // 2. Delete inventory logs for this batch
            db.prepare('DELETE FROM inventory_logs WHERE batch_id = ?').run(id);

            // 3. Delete the batch
            db.prepare('DELETE FROM batches WHERE id = ?').run(id);
        })();

        return NextResponse.json({ success: true, message: `Batch ${batch.batch_no} permanently deleted.` });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

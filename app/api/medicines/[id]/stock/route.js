import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function PATCH(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { quantity, threshold, action, batch_no, mfd, expiry_date } = body;

        const db = getDb();
        const original = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);

        if (!original) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        if (action === 'restock') {
            // Check if a medicine with the same name AND batch_no already exists
            const existingBatch = db.prepare('SELECT * FROM medicines WHERE name = ? AND batch_no = ?').get(original.name, batch_no);

            if (existingBatch) {
                // Update existing batch
                db.prepare(`
                    UPDATE medicines 
                    SET stock_quantity = stock_quantity + ?,
                        mfd = ?,
                        expiry_date = ?
                    WHERE id = ?
                `).run(quantity, mfd, expiry_date, existingBatch.id);
            } else {
                // Create new batch entry by copying original metadata
                db.prepare(`
                    INSERT INTO medicines (
                        name, category, mrp, discount_percent, 
                        stock_quantity, low_stock_threshold,
                        mfd, expiry_date, batch_no
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    original.name, original.category, original.mrp, original.discount_percent,
                    quantity, original.low_stock_threshold,
                    mfd, expiry_date, batch_no
                );
            }
        } else if (action === 'update') {
            db.prepare('UPDATE medicines SET stock_quantity = ?, low_stock_threshold = ? WHERE id = ?').run(quantity, threshold, id);
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updatedMedicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);

        return NextResponse.json({ 
            success: true, 
            medicine: updatedMedicine 
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

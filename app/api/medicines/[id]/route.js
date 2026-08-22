import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'staff')) {
            return NextResponse.json({ error: 'Unauthorized. Access required.' }, { status: 401 });
        }

        const { id } = await params;
        const db = getDb();

        const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        db.transaction(() => {
            // Enable foreign keys for this connection
            db.pragma('foreign_keys = ON');

            // 1. Delete inventory_logs associated with any batches of this medicine
            db.prepare(`
                DELETE FROM inventory_logs 
                WHERE batch_id IN (SELECT id FROM batches WHERE medicine_id = ?)
            `).run(id);

            // 2. Delete order_items associated with this medicine (both via batch and direct med ID)
            db.prepare(`
                DELETE FROM order_items 
                WHERE batch_id IN (SELECT id FROM batches WHERE medicine_id = ?)
                OR medicine_id = ?
            `).run(id, id);

            // 3. Delete all batches of this medicine
            db.prepare('DELETE FROM batches WHERE medicine_id = ?').run(id);

            // 4. Delete the medicine itself
            db.prepare('DELETE FROM medicines WHERE id = ?').run(id);
        })();

        return NextResponse.json({ 
            success: true, 
            message: `Medicine and all associated data deleted successfully.` 
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
        }

        const { id } = await params;
        const db = getDb();
        const body = await request.json();
        const { 
            name, category, mrp, discount_percent, low_stock_threshold
        } = body;

        // Simple validation
        if (!name || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        db.prepare(`
            UPDATE medicines 
            SET name = ?, category = ?, mrp = ?, discount_percent = ?, 
                low_stock_threshold = ?
            WHERE id = ?
        `).run(
            name, category, parseFloat(mrp) || medicine.mrp, parseFloat(discount_percent) || 0,
            parseInt(low_stock_threshold) || 10, id
        );

        const updatedMedicine = db.prepare(`
            SELECT 
                m.*,
                COALESCE(SUM(b.stock), 0) as total_stock
            FROM medicines m
            LEFT JOIN batches b ON m.id = b.medicine_id
            WHERE m.id = ?
            GROUP BY m.id
        `).get(id);

        if (updatedMedicine) {
            updatedMedicine.stock_quantity = updatedMedicine.total_stock;
        }

        return NextResponse.json({ 
            success: true, 
            medicine: updatedMedicine 
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'staff')) {
            return NextResponse.json({ error: 'Unauthorized. Access required.' }, { status: 401 });
        }

        const db = getDb();
        const body = await request.json();
        const { medicine_id, batch_no, mrp, expiry_date, mfd_date, stock, discount_percent } = body;

        if (!medicine_id || !batch_no || !mrp || !expiry_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const medicine = db.prepare('SELECT id FROM medicines WHERE id = ?').get(medicine_id);
        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        const result = db.prepare(`
            INSERT INTO batches (medicine_id, batch_no, mrp, expiry_date, mfd_date, stock, discount_percent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(medicine_id, batch_no, parseFloat(mrp), expiry_date, mfd_date, parseInt(stock) || 0, parseFloat(discount_percent) || 0);

        const newBatch = db.prepare('SELECT * FROM batches WHERE id = ?').get(result.lastInsertRowid);

        return NextResponse.json({ success: true, batch: newBatch });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

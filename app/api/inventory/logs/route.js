import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const logs = db.prepare(`
            SELECT 
                l.*, 
                b.batch_no, 
                m.name as medicine_name
            FROM inventory_logs l
            JOIN batches b ON l.batch_id = b.id
            JOIN medicines m ON b.medicine_id = m.id
            ORDER BY l.created_at DESC
            LIMIT 100
        `).all();

        return NextResponse.json({ logs });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

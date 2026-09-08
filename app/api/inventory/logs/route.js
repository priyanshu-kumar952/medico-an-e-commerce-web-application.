import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();

        if (!session || (session.role !== 'admin' && session.role !== 'staff')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();

        const logs = db.prepare(`
            SELECT
                l.*,
                b.batch_no,
                b.is_active AS batch_active,
                m.name AS medicine_name
            FROM inventory_logs l
            LEFT JOIN batches b
                ON l.batch_id = b.id
            LEFT JOIN medicines m
                ON b.medicine_id = m.id
            ORDER BY l.created_at DESC
            LIMIT 200
        `).all();

        return NextResponse.json({ logs });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

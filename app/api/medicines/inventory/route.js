import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const { searchParams } = new URL(request.url);
        const lowStockOnly = searchParams.get('lowStock') === 'true';
        const category = searchParams.get('category') || '';
        const query = searchParams.get('q') || '';

        let sql = `
            SELECT 
                m.id, m.name, m.category, m.low_stock_threshold, m.discount_percent,
                b.id as batch_id, b.batch_no, b.stock as stock_quantity, b.expiry_date, b.mfd_date, b.mrp, b.discount_percent as batch_discount,
                (SELECT COUNT(*) FROM order_items WHERE batch_id = b.id) > 0 as is_used,
                (SELECT COUNT(*) FROM batches WHERE medicine_id = m.id) as batch_count,
                (SELECT SUM(stock) FROM batches WHERE medicine_id = m.id) as total_stock
            FROM medicines m
            LEFT JOIN batches b ON m.id = b.medicine_id
            WHERE 1=1
        `;
        const params = [];

        if (lowStockOnly) {
            sql += ' AND m.stock_quantity <= m.low_stock_threshold';
        }

        if (category) {
            sql += ' AND m.category = ?';
            params.push(category);
        }

        if (query) {
            sql += ' AND m.name LIKE ?';
            params.push(`%${query}%`);
        }

        sql += ' ORDER BY m.name ASC, b.expiry_date ASC';

        const medicines = db.prepare(sql).all(...params);
        
        return NextResponse.json({ medicines });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

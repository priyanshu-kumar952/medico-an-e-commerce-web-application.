import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateRange = searchParams.get('dateRange') || 'all';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        const db = getDb();
        
        let dateFilter = '';
        const params = [];
        if (year && month) {
            const formattedMonth = String(month).padStart(2, '0');
            dateFilter = ` AND strftime('%Y-%m', o.created_at) = ?`;
            params.push(`${year}-${formattedMonth}`);
        } else if (startDate && endDate) {
            dateFilter = ` AND DATE(o.created_at) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (dateRange === 'day') {
            dateFilter = " AND DATE(o.created_at) = DATE('now', 'localtime')";
        } else if (dateRange === 'yesterday') {
            dateFilter = " AND DATE(o.created_at) = DATE('now', 'localtime', '-1 day')";
        } else if (dateRange === 'week') {
            dateFilter = " AND DATE(o.created_at) >= DATE('now', 'localtime', '-7 days')";
        } else if (dateRange === 'month') {
            dateFilter = " AND DATE(o.created_at) >= DATE('now', 'localtime', 'start of month')";
        } else if (dateRange === 'year') {
            dateFilter = " AND DATE(o.created_at) >= DATE('now', 'localtime', 'start of year')";
        }

        const sales = db.prepare(`
            SELECT 
                DATE(o.created_at) as date, 
                COUNT(o.order_id) as orders,
                CAST(COALESCE(SUM(oi_sub.total_qty), 0) AS INTEGER) as units,
                COALESCE(SUM(b.final_amount), 0) as revenue
            FROM orders o
            LEFT JOIN (
                SELECT order_id, SUM(quantity) as total_qty 
                FROM order_items 
                GROUP BY order_id
            ) oi_sub ON o.order_id = oi_sub.order_id
            LEFT JOIN bills b ON o.order_id = b.order_id
            WHERE o.status = 'Completed'
            ${dateFilter}
            GROUP BY DATE(o.created_at)
            ORDER BY date ASC
        `).all(...params);

        return NextResponse.json({ data: sales });

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

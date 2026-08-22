import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const db = getDb();

    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = ` AND DATE(o.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (dateRange === 'day') {
      dateFilter = " AND DATE(o.created_at) = DATE('now', 'localtime')";
    } else if (dateRange === 'week') {
      dateFilter = " AND DATE(o.created_at) >= DATE('now', 'localtime', '-7 days')";
    } else if (dateRange === 'month') {
      dateFilter = " AND DATE(o.created_at) >= DATE('now', 'localtime', 'start of month')";
    }

    const topMedicines = db.prepare(`
      SELECT 
        oi.medicine_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.line_total) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status IN ('Completed', 'Packed', 'In Progress')${dateFilter}
      GROUP BY oi.medicine_name
      ORDER BY total_quantity DESC
      LIMIT 20
    `).all();

    return NextResponse.json({ medicines: topMedicines });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

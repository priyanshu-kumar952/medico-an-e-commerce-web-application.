import getDb from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
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

    seedDatabase();
    const db = getDb();

    let dateFilter = '';
    if (startDate && endDate) {
      // Custom date range
      dateFilter = ` AND DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (dateRange === 'day') {
      dateFilter = " AND DATE(created_at) = DATE('now', 'localtime')";
    } else if (dateRange === 'yesterday') {
      dateFilter = " AND DATE(created_at) = DATE('now', 'localtime', '-1 day')";
    } else if (dateRange === 'week') {
      dateFilter = " AND DATE(created_at) >= DATE('now', 'localtime', '-7 days')";
    } else if (dateRange === 'month') {
      dateFilter = " AND DATE(created_at) >= DATE('now', 'localtime', 'start of month')";
    }

    const placed = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'PLACED'${dateFilter}`).get().count;
    const packed = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'PACKED'${dateFilter}`).get().count;
    const completed = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'COMPLETED'${dateFilter}`).get().count;
    const cancelled = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'CANCELLED'${dateFilter}`).get().count;
    const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE 1=1${dateFilter}`).get().count;

    const todayRevenue = db.prepare(`
      SELECT COALESCE(SUM(b.final_amount), 0) as total
      FROM bills b
      JOIN orders o ON b.order_id = o.order_id
      WHERE o.status = 'COMPLETED'
      AND DATE(o.completed_at) = DATE('now', 'localtime')
    `).get().total;

    const weekRevenue = db.prepare(`
      SELECT COALESCE(SUM(b.final_amount), 0) as total
      FROM bills b
      JOIN orders o ON b.order_id = o.order_id
      WHERE o.status = 'COMPLETED'
      AND DATE(o.completed_at) >= DATE('now', 'localtime', '-7 days')
    `).get().total;

    const monthRevenue = db.prepare(`
      SELECT COALESCE(SUM(b.final_amount), 0) as total
      FROM bills b
      JOIN orders o ON b.order_id = o.order_id
      WHERE o.status = 'COMPLETED'
      AND DATE(o.completed_at) >= DATE('now', 'localtime', 'start of month')
    `).get().total;

    // Filtered revenue based on selected range
    let filteredRevenueSql = `
      SELECT COALESCE(SUM(b.final_amount), 0) as total
      FROM bills b
      JOIN orders o ON b.order_id = o.order_id
      WHERE o.status = 'COMPLETED'
    `;
    const filteredRevenueData = db.prepare(filteredRevenueSql).get();
    const filteredRevenue = filteredRevenueData.total;

    // New: Calculate total units sold in the timeframe
    let unitsSql = `
      SELECT COALESCE(SUM(oi.quantity), 0) as units
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status = 'COMPLETED'
    `;
    if (startDate && endDate) {
      unitsSql += ` AND DATE(o.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (dateRange === 'day') {
      unitsSql += " AND DATE(o.created_at) = DATE('now', 'localtime')";
    } else if (dateRange === 'yesterday') {
      unitsSql += " AND DATE(o.created_at) = DATE('now', 'localtime', '-1 day')";
    } else if (dateRange === 'week') {
      unitsSql += " AND DATE(o.created_at) >= DATE('now', 'localtime', '-7 days')";
    } else if (dateRange === 'month') {
      unitsSql += " AND DATE(o.created_at) >= DATE('now', 'localtime', 'start of month')";
    }
    const totalUnits = db.prepare(unitsSql).get().units;

    // AOV calculation (Revenue / Completed Orders in timeframe)
    const completedOrdersInTimeframe = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'COMPLETED'${dateFilter}`).get().count;
    const aov = completedOrdersInTimeframe > 0 ? filteredRevenue / completedOrdersInTimeframe : 0;

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(b.final_amount), 0) as total
      FROM bills b
      JOIN orders o ON b.order_id = o.order_id
      WHERE o.status = 'COMPLETED'
    `).get().total;

    return NextResponse.json({
      placed,
      packed,
      completed,
      cancelled,
      total_orders: totalOrders,
      today_revenue: todayRevenue,
      week_revenue: weekRevenue,
      month_revenue: monthRevenue,
      total_revenue: totalRevenue,
      filtered_revenue: filteredRevenue,
      total_units: totalUnits,
      aov: aov
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

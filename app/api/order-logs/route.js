import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

function getDateCondition(dateRange, startDate, endDate) {
    const conditions = [];
    const params = [];

    if (startDate && endDate) {
        conditions.push(`
            datetime(l.timestamp) >= datetime(?)
            AND datetime(l.timestamp) < datetime(?, '+1 day')
        `);
        params.push(startDate, endDate);
        return { conditions, params };
    }

    switch (dateRange) {
        case 'day':
            conditions.push(`
                date(l.timestamp) = date('now', 'localtime')
            `);
            break;

        case 'yesterday':
            conditions.push(`
                date(l.timestamp) = date('now', 'localtime', '-1 day')
            `);
            break;

        case 'week':
            conditions.push(`
                date(l.timestamp) >= date('now', 'localtime', '-6 days')
            `);
            break;

        case 'month':
            conditions.push(`
                date(l.timestamp) >= date('now', 'localtime', 'start of month')
            `);
            break;

        case 'all':
        case '':
        case null:
        case undefined:
            break;

        default:
            break;
    }

    return { conditions, params };
}

export async function GET(request) {
    try {
        const session = await getSession();

        if (!session || (session.role !== 'admin' && session.role !== 'staff')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const { searchParams } = new URL(request.url);

        const status = searchParams.get('status') || '';
        const dateRange = searchParams.get('dateRange') || 'all';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';

        const conditions = [];
        const params = [];

        if (status === 'PLACED') {
            conditions.push(`(
                LOWER(l.action) LIKE '%created%'
                OR LOWER(l.action) LIKE '%received%'
            )`);
        } else if (status === 'PACKED') {
            conditions.push(`LOWER(l.action) LIKE '%packed%'`);
        } else if (status === 'COMPLETED') {
            conditions.push(`LOWER(l.action) LIKE '%completed%'`);
        } else if (status === 'CANCELLED') {
            conditions.push(`LOWER(l.action) LIKE '%cancelled%'`);
        }

        const dateFilter = getDateCondition(dateRange, startDate, endDate);
        conditions.push(...dateFilter.conditions);
        params.push(...dateFilter.params);

        let sql = `
            SELECT
                l.id,
                l.order_id,
                l.action,
                l.performed_by,
                l.timestamp,
                o.status AS current_status
            FROM order_logs l
            LEFT JOIN orders o
                ON o.order_id = l.order_id
        `;

        if (conditions.length) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        sql += ` ORDER BY datetime(l.timestamp) DESC LIMIT 500`;

        const logs = db.prepare(sql).all(...params);

        return NextResponse.json({ logs });
    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

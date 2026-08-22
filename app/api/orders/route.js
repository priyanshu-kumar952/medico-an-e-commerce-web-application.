import getDb, { generateOrderId, generateBillNumber } from '@/lib/db';
import { NextResponse } from 'next/server';
import { rateLimitCheck } from '@/lib/rate-limit';
import { getSession } from '@/lib/auth';

export async function POST(request) {
    try {
        // Simple rate limiting based on IP (or fallback to 'unknown' if not available in this env)
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        if (!rateLimitCheck(ip, 5, 60000)) { // 5 requests per minute
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const db = getDb();
        const body = await request.json();
        const { customer_name, phone, address, items } = body;

        // Validate
        if (!customer_name || !phone || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const phoneTrimmed = phone.trim();
        const phoneRegex = /^[6-9]\d{9}$/;
        const hasManyRepeats = /(.)\1{5,}/.test(phoneTrimmed);
        const isSequential = ['1234567890', '0987654321', '9876543210'].includes(phoneTrimmed);

        if (!phoneRegex.test(phoneTrimmed) || hasManyRepeats || isSequential) {
            return NextResponse.json({ error: 'Please provide a valid, real mobile number' }, { status: 400 });
        }

        const orderId = generateOrderId();
        // Bill number will be generated during packing

        // Use a transaction for atomic order creation
        const createOrder = db.transaction(() => {
            // Server-side stock check
            for (const item of items) {
                const stockData = db.prepare(`
                    SELECT name, COALESCE(SUM(stock), 0) as total_stock 
                    FROM medicines m
                    LEFT JOIN batches b ON m.id = b.medicine_id
                    WHERE m.id = ?
                    GROUP BY m.id
                `).get(item.medicine_id);

                if (!stockData) {
                    throw new Error(`Medicine not found: ${item.medicine_id}`);
                }

                const qty = parseInt(item.quantity);
                if (stockData.total_stock < qty) {
                    throw new Error(`Insufficient stock for ${stockData.name}. Available: ${stockData.total_stock}, Requested: ${qty}`);
                }
            }

            // Create order with 'PLACED' status
            db.prepare(
                'INSERT INTO orders (order_id, customer_name, phone, address, status) VALUES (?, ?, ?, ?, ?)'
            ).run(orderId, customer_name, phone, address || '', 'PLACED');

            // Process items - omit pricing logic
            const processedItems = [];

            const insertItem = db.prepare(
                'INSERT INTO order_items (order_id, medicine_id, medicine_name, quantity, mrp, discount_percent, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)'
            );

            for (const item of items) {
                // Fetch medicine name (without checking stock)
                const medicine = db.prepare('SELECT id, name FROM medicines WHERE id = ?').get(item.medicine_id);
                if (!medicine) {
                    throw new Error(`Medicine not found: ${item.medicine_id}`);
                }

                const qty = parseInt(item.quantity);

                // Insert with 0 for pricing fields as they will be updated during packing
                insertItem.run(orderId, medicine.id, medicine.name, qty, 0, 0, 0);

                processedItems.push({
                    medicine_id: medicine.id,
                    medicine_name: medicine.name,
                    quantity: qty,
                });
            }

            // Log
            db.prepare(
                'INSERT INTO order_logs (order_id, action, performed_by) VALUES (?, ?, ?)'
            ).run(orderId, 'Order received and awaiting preparation', 'system');

            return {
                order_id: orderId,
                customer_name,
                phone,
                address: address || '',
                status: 'PLACED',
                items: processedItems,
                created_at: new Date().toISOString(),
                message: 'Order placed successfully. Final bill will be generated after packing based on available batches.'
            };
        });

        const result = createOrder();

        return NextResponse.json(result);
    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const phone = searchParams.get('phone') || '';
        const order_id = searchParams.get('order_id') || '';
        const sort = searchParams.get('sort') || 'newest';
        const dateRange = searchParams.get('dateRange') || 'all';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const offset = (page - 1) * limit;

        const session = await getSession();
        if (!session && !searchParams.get('phone')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();

        let sql = `
            FROM orders o
            LEFT JOIN bills b ON o.order_id = b.order_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            sql += ' AND o.status = ?';
            params.push(status);
        }

        if (phone && order_id) {
            sql += ' AND (o.phone = ? OR o.order_id = ?)';
            params.push(phone, order_id);
        } else if (phone) {
            sql += ' AND o.phone = ?';
            params.push(phone);
        } else if (order_id) {
            sql += ' AND o.order_id = ?';
            params.push(order_id);
        }

        if (search) {
            sql += ` AND (
                o.order_id LIKE ? OR 
                o.customer_name LIKE ? OR 
                o.phone LIKE ? OR 
                b.bill_number LIKE ?
            )`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (startDate && endDate) {
            sql += ` AND DATE(o.created_at) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (dateRange === 'day') {
            sql += " AND DATE(o.created_at) = DATE('now', 'localtime')";
        } else if (dateRange === 'yesterday') {
            sql += " AND DATE(o.created_at) = DATE('now', 'localtime', '-1 day')";
        } else if (dateRange === 'week') {
            sql += " AND DATE(o.created_at) >= DATE('now', 'localtime', '-7 days')";
        } else if (dateRange === 'month') {
            sql += " AND DATE(o.created_at) >= DATE('now', 'localtime', 'start of month')";
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as count ${sql}`;
        const totalCount = db.prepare(countQuery).get(...params).count;

        // Add sorting and pagination
        sql += sort === 'oldest' ? ' ORDER BY o.created_at ASC' : ' ORDER BY o.created_at DESC';
        sql += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const selectSql = `SELECT o.*, b.bill_number, b.final_amount, b.subtotal, b.total_discount ${sql}`;
        const orders = db.prepare(selectSql).all(...params);

        return NextResponse.json({
            orders,
            pagination: {
                total_count: totalCount,
                total_pages: Math.ceil(totalCount / limit),
                current_page: page,
                limit
            }
        });
    } catch (error) {
        console.error('Orders GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

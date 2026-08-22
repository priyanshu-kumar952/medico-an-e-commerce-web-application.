import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const category = searchParams.get('category') || '';

        let sql = `
            SELECT 
                m.*,
                COALESCE(SUM(b.stock), 0) as total_stock,
                COUNT(b.id) as batch_count
            FROM medicines m
            LEFT JOIN batches b ON m.id = b.medicine_id
            WHERE 1=1
        `;
        const params = [];

        if (query) {
            sql += ' AND m.name LIKE ?';
            params.push(`%${query}%`);
        }

        if (category) {
            sql += ' AND m.category = ?';
            params.push(category);
        }

        sql += ' GROUP BY m.id ORDER BY m.category, m.name';

        const medicines = db.prepare(sql).all(...params);
        
        // Also fetch individual batches for the inventory expansion
        const batchesStmt = db.prepare('SELECT * FROM batches ORDER BY expiry_date ASC');
        const allBatches = batchesStmt.all();
        
        // Attach batches to their respective medicines
        const medicinesWithBatches = medicines.map(med => ({
            ...med,
            stock_quantity: med.total_stock, // Map for backwards compatibility in UI until fully updated
            batches: allBatches.filter(b => b.medicine_id === med.id)
        }));

        const categories = db.prepare('SELECT DISTINCT category FROM medicines ORDER BY category').all();

        return NextResponse.json({ medicines: medicinesWithBatches, categories: categories.map(c => c.category) });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const body = await request.json();
        const { 
            name, category, mrp, discount_percent, 
            stock_quantity, low_stock_threshold,
            mfd, expiry_date, mfd_date, batch_no 
        } = body;

        // Simple validation
        if (!name || !category || !mrp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let newMedicine;
        
        db.transaction(() => {
            const result = db.prepare(`
                INSERT INTO medicines (
                    name, category, mrp, discount_percent, 
                    stock_quantity, low_stock_threshold,
                    mfd, expiry_date, batch_no
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                name, category, parseFloat(mrp), parseFloat(discount_percent) || 0,
                0, parseInt(low_stock_threshold) || 10,
                mfd, expiry_date, batch_no || 'INITIAL'
            );

            const medicineId = result.lastInsertRowid;
            
            // Insert initial batch if stock is provided
            if (parseInt(stock_quantity) > 0 || batch_no || expiry_date) {
                db.prepare(`
                    INSERT INTO batches (medicine_id, batch_no, mrp, expiry_date, mfd_date, stock)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    medicineId,
                    batch_no || `B-${Date.now().toString().slice(-6)}`,
                    parseFloat(mrp),
                    expiry_date || '2030-12-31',
                    mfd_date || mfd, // Use mfd_date if available, fallback to mfd
                    parseInt(stock_quantity) || 0
                );
            }

            // Fetch the inserted record
            newMedicine = db.prepare(`
                SELECT 
                    m.*,
                    COALESCE(SUM(b.stock), 0) as total_stock
                FROM medicines m
                LEFT JOIN batches b ON m.id = b.medicine_id
                WHERE m.id = ?
                GROUP BY m.id
            `).get(medicineId);
            
            if (newMedicine) {
                newMedicine.stock_quantity = newMedicine.total_stock;
            }
        })();

        return NextResponse.json({ 
            success: true, 
            medicine: newMedicine 
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

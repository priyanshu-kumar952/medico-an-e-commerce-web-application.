import bcryptjs from 'bcryptjs';

export function seedDatabase(db) {
    if (!db) return;

    // Check if already seeded
    const medicineCount = db.prepare('SELECT COUNT(*) as count FROM medicines').get().count;
    if (medicineCount > 0) return;

    // ─── Seed Medicines ───
    const medicines = [
        // Antibiotics
        { name: 'Amoxicillin 500mg', category: 'Antibiotics', mrp: 85.00, discount_percent: 15, stock_quantity: 50, low_stock_threshold: 10 },
        { name: 'Azithromycin 500mg', category: 'Antibiotics', mrp: 120.00, discount_percent: 20, stock_quantity: 30, low_stock_threshold: 10 },
        { name: 'Ciprofloxacin 500mg', category: 'Antibiotics', mrp: 65.00, discount_percent: 15, stock_quantity: 40, low_stock_threshold: 10 },
        { name: 'Metronidazole 400mg', category: 'Antibiotics', mrp: 35.00, discount_percent: 10, stock_quantity: 100, low_stock_threshold: 20 },
        // Pain Relief
        { name: 'Paracetamol 500mg', category: 'Pain Relief', mrp: 25.00, discount_percent: 10, stock_quantity: 200, low_stock_threshold: 50 },
        { name: 'Ibuprofen 400mg', category: 'Pain Relief', mrp: 40.00, discount_percent: 15, stock_quantity: 15, low_stock_threshold: 20 }, // Low stock test case
        { name: 'Diclofenac 50mg', category: 'Pain Relief', mrp: 55.00, discount_percent: 20, stock_quantity: 60, low_stock_threshold: 15 },
        { name: 'Aspirin 75mg', category: 'Pain Relief', mrp: 30.00, discount_percent: 10, stock_quantity: 80, low_stock_threshold: 20 },
        // Vitamins & Supplements
        { name: 'Vitamin C 500mg', category: 'Vitamins', mrp: 150.00, discount_percent: 25, stock_quantity: 45, low_stock_threshold: 15 },
        { name: 'Vitamin D3 60K IU', category: 'Vitamins', mrp: 120.00, discount_percent: 20, stock_quantity: 35, low_stock_threshold: 10 },
        { name: 'Multivitamin Tablets', category: 'Vitamins', mrp: 250.00, discount_percent: 20, stock_quantity: 25, low_stock_threshold: 10 },
        { name: 'Calcium + D3 Tablets', category: 'Vitamins', mrp: 180.00, discount_percent: 15, stock_quantity: 40, low_stock_threshold: 10 },
        { name: 'Iron + Folic Acid', category: 'Vitamins', mrp: 95.00, discount_percent: 15, stock_quantity: 50, low_stock_threshold: 15 },
        // Digestive
        { name: 'Omeprazole 20mg', category: 'Digestive', mrp: 70.00, discount_percent: 15, stock_quantity: 60, low_stock_threshold: 20 },
        { name: 'Pantoprazole 40mg', category: 'Digestive', mrp: 90.00, discount_percent: 20, stock_quantity: 70, low_stock_threshold: 20 },
        { name: 'Domperidone 10mg', category: 'Digestive', mrp: 45.00, discount_percent: 10, stock_quantity: 80, low_stock_threshold: 15 },
        { name: 'Ranitidine 150mg', category: 'Digestive', mrp: 35.00, discount_percent: 10, stock_quantity: 5, low_stock_threshold: 10 }, // Low stock test case
        // Allergy & Cold
        { name: 'Cetirizine 10mg', category: 'Allergy', mrp: 30.00, discount_percent: 15, stock_quantity: 100, low_stock_threshold: 30 },
        { name: 'Levocetirizine 5mg', category: 'Allergy', mrp: 45.00, discount_percent: 20, stock_quantity: 90, low_stock_threshold: 25 },
        { name: 'Montelukast 10mg', category: 'Allergy', mrp: 140.00, discount_percent: 15, stock_quantity: 40, low_stock_threshold: 15 },
        // Diabetes
        { name: 'Metformin 500mg', category: 'Diabetes', mrp: 35.00, discount_percent: 10, stock_quantity: 120, low_stock_threshold: 30 },
        { name: 'Glimepiride 2mg', category: 'Diabetes', mrp: 80.00, discount_percent: 15, stock_quantity: 50, low_stock_threshold: 15 },
        // Cardiac
        { name: 'Atorvastatin 10mg', category: 'Cardiac', mrp: 95.00, discount_percent: 20, stock_quantity: 60, low_stock_threshold: 20 },
        { name: 'Amlodipine 5mg', category: 'Cardiac', mrp: 45.00, discount_percent: 15, stock_quantity: 70, low_stock_threshold: 20 },
        { name: 'Telmisartan 40mg', category: 'Cardiac', mrp: 75.00, discount_percent: 15, stock_quantity: 40, low_stock_threshold: 15 },
    ];

    const insertMedicine = db.prepare(
        'INSERT INTO medicines (name, category, mrp, discount_percent, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertMany = db.transaction((meds) => {
        for (const med of meds) {
            insertMedicine.run(med.name, med.category, med.mrp, med.discount_percent, med.stock_quantity, med.low_stock_threshold);
        }
    });
    insertMany(medicines);

    // ─── Seed Staff ───
    const adminHash = bcryptjs.hashSync('admin123', 10);
    const staffHash = bcryptjs.hashSync('staff123', 10);

    const insertStaff = db.prepare(
        'INSERT OR IGNORE INTO staff (staff_id, name, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    insertStaff.run('ADMIN001', 'Admin', adminHash, 'admin');
    insertStaff.run('STAFF001', 'Staff Member', staffHash, 'staff');

    console.log('✅ Database seeded with medicines and staff accounts.');
}

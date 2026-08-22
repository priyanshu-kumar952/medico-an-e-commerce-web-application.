'use client';

import { useState, useEffect } from 'react';

export default function ExpiryAlerts({ onClose }) {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState({ expired: [], critical: [], warning: [] });

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            // Fetching all inventory to check expiry
            const res = await fetch('/api/medicines/inventory');
            const data = await res.json();
            const meds = data.medicines || [];
            classifyMedicines(meds);
        } catch (error) {
            console.error('Failed to fetch medicines for alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        // If it's MM/YY format, convert to a parsable Date object
        if (typeof dateStr === 'string' && dateStr.includes('/') && !dateStr.includes('-')) {
            const [mm, yy] = dateStr.split('/');
            const year = yy.length === 2 ? `20${yy}` : yy;
            // Use the last day of the month or first? 
            // Usually, expiry 10/27 means it's good UNTIL October 2027.
            // Let's use the first day of the month for simplicity or last day.
            // The user's example says "expiry_date - current_date".
            return new Date(parseInt(year), parseInt(mm) - 1, 1);
        }
        return new Date(dateStr);
    };

    const classifyMedicines = (meds) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expired = [];
        const critical = [];
        const warning = [];

        meds.forEach(med => {
            const expiry = parseDate(med.expiry_date);
            if (!expiry || isNaN(expiry.getTime())) return;

            const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

            const medData = { ...med, daysRemaining: days };

            if (days <= 0) {
                expired.push(medData);
            } else if (days <= 30) {
                critical.push(medData);
            } else if (days <= 60) {
                warning.push(medData);
            }
        });

        // Sorting by closest expiry date
        const sortByExpiry = (a, b) => a.daysRemaining - b.daysRemaining;

        setGroups({
            expired: expired.sort(sortByExpiry),
            critical: critical.sort(sortByExpiry),
            warning: warning.sort(sortByExpiry)
        });
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 3000, padding: '1rem',
            backdropFilter: 'blur(8px)'
        }}>
            <div className="glass-card" style={{ 
                maxWidth: '900px', 
                width: '100%', 
                maxHeight: '90vh', 
                overflowY: 'auto',
                border: '1px solid var(--border-hover)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.75rem' }}>⚠️</span> Low Stock & Expiry Alerts
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                            Medicines prioritized by urgency (≤60 days).
                        </p>
                    </div>
                    <button onClick={onClose} style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--border-color)', 
                        color: 'white', 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.25rem', 
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                    }} className="close-btn">×</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Analyzing inventory...</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* EXPIRED SECTION */}
                        <section>
                            <div style={{ 
                                background: 'rgba(239, 68, 68, 0.15)', 
                                padding: '0.75rem 1.25rem', 
                                borderRadius: '8px', 
                                borderLeft: '4px solid #ff4d4f',
                                marginBottom: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ color: '#ff4d4f', margin: 0, fontSize: '1.1rem' }}>Expired Medicines</h3>
                                <span style={{ background: '#ff4d4f', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {groups.expired.length} ITEMS
                                </span>
                            </div>
                            {groups.expired.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No expired medicines found.</p>
                            ) : (
                                <ExpiryTable medicines={groups.expired} color="#ff4d4f" />
                            )}
                        </section>

                        {/* CRITICAL SECTION */}
                        <section>
                            <div style={{ 
                                background: 'rgba(255, 169, 64, 0.15)', 
                                padding: '0.75rem 1.25rem', 
                                borderRadius: '8px', 
                                borderLeft: '4px solid #ffa940',
                                marginBottom: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ color: '#ffa940', margin: 0, fontSize: '1.1rem' }}>Critical Expiry (≤30 Days)</h3>
                                <span style={{ background: '#ffa940', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {groups.critical.length} ITEMS
                                </span>
                            </div>
                            {groups.critical.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No medicines in critical urgency.</p>
                            ) : (
                                <ExpiryTable medicines={groups.critical} color="#ffa940" />
                            )}
                        </section>

                        {/* WARNING SECTION */}
                        <section>
                            <div style={{ 
                                background: 'rgba(115, 209, 61, 0.15)', 
                                padding: '0.75rem 1.25rem', 
                                borderRadius: '8px', 
                                borderLeft: '4px solid #73d13d',
                                marginBottom: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ color: '#73d13d', margin: 0, fontSize: '1.1rem' }}>Upcoming Expiry (30-60 Days)</h3>
                                <span style={{ background: '#73d13d', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {groups.warning.length} ITEMS
                                </span>
                            </div>
                            {groups.warning.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No upcoming expires in next 2 months.</p>
                            ) : (
                                <ExpiryTable medicines={groups.warning} color="#73d13d" />
                            )}
                        </section>

                    </div>
                )}

                <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Close Alerts</button>
                </div>
            </div>
            <style jsx>{`
                .close-btn:hover {
                    background: rgba(239, 68, 68, 0.2) !important;
                    color: #ff4d4f !important;
                    transform: rotate(90deg);
                }
            `}</style>
        </div>
    );
}

function ExpiryTable({ medicines, color }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table className="invoice-table" style={{ marginBottom: 0 }}>
                <thead>
                    <tr>
                        <th style={{ background: 'transparent' }}>Medicine Name</th>
                        <th style={{ background: 'transparent' }} className="text-right">Quantity</th>
                        <th style={{ background: 'transparent' }} className="text-right">Expiry Date</th>
                        <th style={{ background: 'transparent' }} className="text-right">Days Left</th>
                    </tr>
                </thead>
                <tbody>
                    {medicines.map(med => (
                        <tr key={med.id}>
                            <td style={{ fontWeight: '500' }}>{med.name}</td>
                            <td className="text-right" style={{ fontWeight: '600' }}>{med.stock_quantity}</td>
                            <td className="text-right" style={{ color: color }}>{med.expiry_date}</td>
                            <td className="text-right">
                                <span style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    background: med.daysRemaining <= 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                    color: med.daysRemaining <= 0 ? '#ff4d4f' : 'inherit',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold'
                                }}>
                                    {med.daysRemaining <= 0 ? 'EXPIRED' : `${med.daysRemaining} days`}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

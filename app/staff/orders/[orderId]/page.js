'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ToastProvider, useToast } from '@/components/Toast';

function OrderDetailContent({ orderId }) {
    const [staff, setStaff] = useState(null);
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [packingItems, setPackingItems] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const addToast = useToast();
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('staff');
        if (!stored) { router.push('/staff/login'); return; }
        setStaff(JSON.parse(stored));
    }, [router]);

    const fetchOrder = useCallback(async () => {
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            const data = await res.json();
            if (res.ok) { 
                setOrder(data.order); 
                setItems(data.items); 
                setLogs(data.logs);
                // Initialize packing array if starting from PLACED
                if (data.order.status === 'PLACED') {
                    setPackingItems(data.items.map(i => ({ ...i, selected_medicine_id: '' })));
                }
            }
            else { addToast('Order not found', 'error'); }
        } catch (err) { addToast('Failed to load order', 'error'); }
        finally { setLoading(false); }
    }, [orderId, addToast]);

    const fetchInventory = useCallback(async () => {
        try {
            const res = await fetch(`/api/medicines`);
            const data = await res.json();
            if (res.ok) {
                setInventory(data.medicines);
            }
        } catch (err) {
            console.error('Failed to load inventory for packing');
        }
    }, []);

    useEffect(() => { 
        if (staff) { 
            fetchOrder();
            fetchInventory();
        } 
    }, [staff, fetchOrder, fetchInventory]);

    const handleBatchChange = (index, medicineId) => {
        const newPackingItems = [...packingItems];
        newPackingItems[index].selected_medicine_id = medicineId;
        setPackingItems(newPackingItems);
    };

    const confirmAndPackOrder = async () => {
        // Validate all items have a batch selected
        if (packingItems.some(i => !i.selected_medicine_id)) {
            return addToast('Please select a batch for all items', 'error');
        }

        setUpdating(true);
        try {
            const payload = {
                staff_id: staff.staff_id,
                items: packingItems.map(i => ({
                    medicine_name: i.medicine_name,
                    medicine_id: i.selected_medicine_id,
                    quantity: i.quantity
                }))
            };

            const res = await fetch(`/api/orders/${orderId}/pack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) { 
                addToast('Order packed successfully! Prices generated.', 'success'); 
                fetchOrder(); 
            } else { 
                addToast(data.error || 'Packing failed', 'error'); 
            }
        } catch (err) { 
            addToast('Packing failed', 'error'); 
        } finally { 
            setUpdating(false); 
        }
    };

    const updateStatus = async (newStatus, reason = '', skipToast = false) => {
        setUpdating(true);
        try {
            const body = { 
                status: newStatus, 
                staff_id: staff.staff_id,
                reason: reason
            };
            if (newStatus === 'CANCELLED') body.cancelled_by = staff.staff_id;
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) { 
                if (!skipToast) addToast(`Order marked as ${newStatus.replace('_', ' ')}`, 'success'); 
                fetchOrder(); 
                return true;
            }
            else { 
                addToast(data.error || 'Update failed', 'error'); 
                return false;
            }
        } catch (err) { 
            addToast('Update failed', 'error'); 
            return false;
        }
        finally { setUpdating(false); }
    };

    const handleCancelOrder = async (e) => {
        e.preventDefault();
        if (!cancelReason.trim()) return addToast('Please provide a reason for cancellation', 'error');
        
        const success = await updateStatus('CANCELLED', cancelReason);
        if (success) {
            // Trigger WhatsApp with the reason
            const waLink = generateWhatsAppNotification(cancelReason);
            window.open(waLink, '_blank');
            setShowCancelModal(false);
            setCancelReason('');
        }
    };

    const generateWhatsAppNotification = (reason = '') => {
        if (!order) return '#';
        let message = '';
        
        // Prioritize Cancellation message if reason is provided or status is CANCELLED
        if (order.status === 'CANCELLED' || reason) {
            const cancellationReason = reason || 'Inventory issues';
            message = `🏥 MITHILA MEDICO\n\nDear ${order.customer_name},\n\nWe are sorry to inform you that the order you have placed (#${order.order_id}) has been CANCELLED.\n\nReason: ${cancellationReason}\n\nWe apologize for any inconvenience caused. Thank you.`;
        } else if (order.status === 'PACKED') {
            message = `🏥 MITHILA MEDICO\n\nYour order #${order.order_id} has been packed.\n\nTotal Payable: ₹${order.final_amount?.toFixed(2)}\n\nPlease collect your order from:\n\nMithila Medico\nGauriya Math, Gandhi Path\nGardanibagh, Patna\n\nPhone: 8579904555`;
        } else if (order.status === 'COMPLETED') {
            message = `🏥 MITHILA MEDICO\n\nYour order #${order.order_id} is complete.\nThank you for choosing Mithila Medico!\n\nPhone: 8579904555`;
        } else {
            const itemsList = items.map((item, i) => `${i + 1}. ${item.medicine_name} × ${item.quantity}`).join('\n');
            const trackLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/track`;
            const orderTime = new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
            message = `🏥 MITHILA MEDICO – ORDER CONFIRMATION\n\nHello ${order.customer_name},\n\nYour order has been placed successfully.\n\nOrder Number: #${order.order_id}\nTime: ${orderTime}\n\nMedicines Ordered:\n${itemsList}\n\nEstimated Total: ₹${order.final_amount?.toFixed(2)}\n\nTrack your order here:\n${trackLink}\n\nStore Address:\nMithila Medico\nGauriya Math, Gandhi Path\nGardanibagh, Patna\n\nPhone: 8579904555`;
        }
        return `https://wa.me/91${order.phone}?text=${encodeURIComponent(message)}`;
    };

    const downloadInvoice = () => {
        if (!order || !items) return;
        const printWindow = window.open('', '_blank');
        const invoiceDate = new Date(order.created_at).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
        });

        printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${order.bill_number}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2rem; color: #1a1a2e; }
            .invoice { max-width: 700px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #1565C0; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
            .header h1 { font-size: 1.75rem; margin-bottom: 0.1rem; color: #1565C0; }
            .header .estd { font-size: 0.85rem; color: #888; margin-bottom: 0.5rem; }
            .header p { font-size: 0.85rem; color: #555; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 1.5rem; font-size: 0.9rem; }
            .meta div { line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
            th { background: #e3f2fd; text-align: left; padding: 0.6rem 0.75rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #1565C0; color: #1565C0; }
            td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }
            .text-right { text-align: right; }
            .totals { border-top: 2px solid #1565C0; padding-top: 1rem; }
            .totals .row { display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.95rem; }
            .totals .row.total { font-weight: 700; font-size: 1.15rem; border-top: 1px solid #ccc; margin-top: 0.5rem; padding-top: 0.75rem; }
            .footer { text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eee; font-size: 0.8rem; color: #888; }
            @media print { body { padding: 0; } .no-print { display: none; } }
        </style></head><body>
            <div class="invoice">
                <div class="header">
                    <h1>🏥 MITHILA MEDICO</h1>
                    <div class="estd">ESTD 1994</div>
                    <p>Gauriya Math, Gandhi Path, Jakkanpur, Gardanibagh</p>
                    <p>Patna, Bihar 800001</p>
                    <p>Phone: 8579904555</p>
                </div>
                <div class="meta">
                    <div><strong>Invoice No:</strong> ${order.bill_number}<br/><strong>Order No:</strong> ${order.order_id}<br/><strong>Date:</strong> ${invoiceDate}</div>
                    <div style="text-align: right;"><strong>Customer:</strong> ${order.customer_name}<br/><strong>Phone:</strong> ${order.phone}<br/>${order.address ? `<strong>Address:</strong> ${order.address}` : ''}</div>
                </div>
                <table>
                    <thead><tr><th>#</th><th>Medicine Name</th><th class="text-right">Qty</th><th class="text-right">MRP</th><th class="text-right">Discount</th><th class="text-right">Amount</th></tr></thead>
                    <tbody>${items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.medicine_name}</td><td class="text-right">${item.quantity}</td><td class="text-right">₹${item.mrp.toFixed(2)}</td><td class="text-right">${item.discount_percent}%</td><td class="text-right">₹${item.line_total.toFixed(2)}</td></tr>`).join('')}</tbody>
                </table>
                <div class="totals">
                    <div class="row"><span>Total MRP</span><span>₹${order.subtotal?.toFixed(2)}</span></div>
                    <div class="row"><span>Discount</span><span>-₹${order.total_discount?.toFixed(2)}</span></div>
                    <div class="row total"><span>Final Payable Amount</span><span>₹${order.final_amount?.toFixed(2)}</span></div>
                </div>
                <div class="footer">
                    <p>Thank you for choosing Mithila Medico.</p>
                    <p style="margin-top: 0.25rem;">Serving Patna Since 1994.</p>
                </div>
            </div>
            <div class="no-print" style="text-align: center; margin-top: 2rem;">
                <button onclick="window.print()" style="padding: 0.75rem 2rem; background: #1565C0; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">🖨 Print / Save as PDF</button>
            </div>
        </body></html>`);
        printWindow.document.close();
    };

    const getBadgeClass = (status) => {
        switch (status) {
            case 'PLACED': return 'badge-progress';
            case 'PACKED': return 'badge-packed';
            case 'COMPLETED': return 'badge-completed';
            case 'CANCELLED': return 'badge-cancelled';
            default: return '';
        }
    };

    const dashboardLink = staff?.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard';

    if (loading) return <div className="loading-page"><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>;
    if (!order) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <h2>Order Not Found</h2>
            <Link href={dashboardLink} className="btn btn-primary">Back to Dashboard</Link>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <nav className="navbar scrolled" style={{ position: 'sticky' }}>
                <div className="container">
                    <Link href={dashboardLink} className="logo">
                        <span className="logo-icon">🏥</span>
                        Mithila Medico <span style={{ fontWeight: '400', fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{staff?.role === 'admin' ? 'Owner' : 'Staff'} Panel</span>
                    </Link>
                    <Link href={dashboardLink} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
                </div>
            </nav>

            <div className="container" style={{ padding: '2rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Order: {order.order_id}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Bill: {order.bill_number}</p>
                    </div>
                    <span className={`badge ${getBadgeClass(order.status)}`} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>{order.status}</span>
                </div>

                <div className="detail-grid">
                    <div>
                        {/* Customer Info */}
                        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Customer Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</div><div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{order.customer_name}</div></div>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</div><div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{order.phone}</div></div>
                                {order.address && <div style={{ gridColumn: 'span 2' }}><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</div><div style={{ fontWeight: '500' }}>{order.address}</div></div>}
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Placed</div><div style={{ fontWeight: '500' }}>{new Date(order.created_at).toLocaleString('en-IN')}</div></div>
                                <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Updated</div><div style={{ fontWeight: '500' }}>{new Date(order.updated_at).toLocaleString('en-IN')}</div></div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Medicine Items</h3>
                            
                            {order.status === 'PLACED' ? (
                                <div>
                                    <div style={{ padding: '0.75rem', background: 'rgba(21, 101, 192, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        Please select the specific medicine/batch being packed for each item to generate the final bill.
                                    </div>
                                    <table className="invoice-table">
                                        <thead><tr><th>Requested Item</th><th>Qty</th><th>Select Batch to Pack</th></tr></thead>
                                        <tbody>
                                            {packingItems.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.medicine_name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>
                                                        <select 
                                                            className="form-input" 
                                                            style={{ padding: '0.5rem', fontSize: '0.85rem', width: '100%', borderColor: inventory.filter(med => med.name === item.medicine_name).flatMap(med => med.batches).length === 0 ? 'var(--accent-red)' : '' }}
                                                            value={item.selected_medicine_id}
                                                            onChange={(e) => handleBatchChange(i, e.target.value)}
                                                        >
                                                            <option value="">-- Select Batch --</option>
                                                            {inventory
                                                                .filter(med => med.name === item.medicine_name)
                                                                .flatMap(med => med.batches)
                                                                .map(batch => (
                                                                    <option key={batch.id} value={batch.id}>
                                                                        Batch: {batch.batch_no} | Expiry: {batch.expiry_date} | Stock: {batch.stock} | ₹{batch.mrp.toFixed(2)}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        {inventory.filter(med => med.name === item.medicine_name).flatMap(med => med.batches).length === 0 && (
                                                            <div style={{ color: 'var(--accent-red)', fontSize: '0.7rem', marginTop: '0.25rem', fontWeight: '600' }}>⚠️ No batches available for this medicine!</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <>
                                    <table className="invoice-table">
                                        <thead><tr><th>Medicine</th><th>Qty</th><th className="text-right">MRP</th><th className="text-right">Disc.</th><th className="text-right">Net</th></tr></thead>
                                        <tbody>
                                            {items.map((item, i) => (
                                                <tr key={i}><td>{item.medicine_name}</td><td>{item.quantity}</td><td className="text-right">₹{item.mrp.toFixed(2)}</td><td className="text-right" style={{ color: 'var(--accent-amber)' }}>{item.discount_percent}%</td><td className="text-right" style={{ fontWeight: '600' }}>₹{item.line_total.toFixed(2)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                        <div className="cart-summary-row"><span style={{ color: 'var(--text-secondary)' }}>Total MRP</span><span>₹{order.subtotal?.toFixed(2)}</span></div>
                                        <div className="cart-summary-row"><span style={{ color: 'var(--text-secondary)' }}>Discount</span><span style={{ color: 'var(--accent-emerald)' }}>-₹{order.total_discount?.toFixed(2)}</span></div>
                                        <div className="cart-summary-row total"><span>Payable</span><span style={{ color: 'var(--accent-emerald)' }}>₹{order.final_amount?.toFixed(2)}</span></div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        {/* Actions */}
                        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Actions</h3>
                            <div className="detail-actions" style={{ flexDirection: 'column' }}>
                                {order.status === 'PLACED' && (
                                    <>
                                        <button className="btn btn-amber btn-full" onClick={confirmAndPackOrder} disabled={updating} id="mark-packed-btn">{updating ? 'Updating...' : '📦 Confirm Prices & Pack Order'}</button>
                                        <button className="btn btn-danger btn-full" onClick={() => setShowCancelModal(true)} disabled={updating} id="cancel-order-btn">❌ Cancel Order</button>
                                    </>
                                )}
                                {order.status === 'PACKED' && (
                                    <>
                                        <button className="btn btn-success btn-full" onClick={() => updateStatus('COMPLETED')} disabled={updating} id="mark-completed-btn">{updating ? 'Updating...' : '✅ Mark as Completed'}</button>
                                    </>
                                )}
                                {order.status === 'COMPLETED' && (
                                    <div style={{ padding: '1rem', background: 'rgba(46, 125, 50, 0.1)', border: '1px solid rgba(46, 125, 50, 0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--accent-emerald)', fontWeight: '500' }}>✅ Order Completed</div>
                                )}
                                {order.status === 'CANCELLED' && (
                                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--accent-red)', fontWeight: '500' }}>
                                        ❌ Order Cancelled{order.cancelled_by && <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.8 }}>by {order.cancelled_by}</div>}
                                    </div>
                                )}
                                {order.status !== 'PLACED' && (
                                    <>
                                        <a href={generateWhatsAppNotification()} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-full" style={{ textAlign: 'center' }}>💬 Send WhatsApp Notification</a>
                                        <button className="btn btn-secondary btn-full" onClick={downloadInvoice}>📄 Download Invoice</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Audit Log */}
                        <div className="glass-card">
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Audit Log</h3>
                            {logs.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No logs yet</p>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="log-entry">
                                        <div className="log-action">{log.action}</div>
                                        <div className="log-meta">By: {log.performed_by} • {new Date(log.timestamp).toLocaleString('en-IN')}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancellation Modal */}
            {showCancelModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 3000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--accent-red)' }}>Cancel Order</h2>
                            <button onClick={() => setShowCancelModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Please provide a reason for cancelling order <strong>#{order.order_id}</strong>. This will be sent to the customer via WhatsApp.
                        </p>
                        <form onSubmit={handleCancelOrder}>
                            <div className="form-group">
                                <label>Cancellation Reason *</label>
                                <textarea 
                                    className="form-input" 
                                    required 
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                    placeholder="e.g. Medicine no. 4 is not available, Out of stock..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button type="submit" className="btn btn-danger btn-full" style={{ background: '#d32f2f' }}>
                                    Confirm & Send WhatsApp Msg
                                </button>
                                <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowCancelModal(false)}>
                                    Keep Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function StaffOrderDetailPage({ params }) {
    const resolvedParams = use(params);
    return <ToastProvider><OrderDetailContent orderId={resolvedParams.orderId} /></ToastProvider>;
}

'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function TrackContent() {
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get('phone') || '');
    const [ordersList, setOrdersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const addToast = useToast();

    useEffect(() => {
        const phone = searchParams.get('phone');
        const history = searchParams.get('history');
        if (phone) {
            setSearchValue(phone);
            searchOrder(history === 'true');
        }
    }, [searchParams]);

    // Customer-visible statuses mapped to strictly defined DB states
    const statuses = ['Order Received', 'Order Packed', 'Order Collected'];

    const getStatusIndex = (status) => {
        if (status === 'CANCELLED') return -1;
        if (status === 'PLACED') return 0;
        if (status === 'PACKED') return 1;
        if (status === 'COMPLETED') return 2;
        return 0;
    };

    const downloadInvoice = (order, items) => {
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

    const searchOrder = async (isHistory = false) => {
        if (!searchValue.trim()) return addToast('Please enter an Order ID or phone number', 'error');

        setLoading(true);
        setSearched(true);
        setOrdersList([]);
        try {
            // First try ID search
            let res = await fetch(`/api/orders/${encodeURIComponent(searchValue.trim())}`);
            if (res.ok) {
                const data = await res.json();
                setOrdersList([{ order: data.order, items: data.items }]);
                return;
            }

            // Fallback to phone search
            res = await fetch(`/api/orders?phone=${encodeURIComponent(searchValue.trim())}`);
            const data = await res.json();
            if (data.orders && data.orders.length > 0) {
                let filteredOrders = data.orders.filter(o => o.status !== 'CANCELLED');
                
                // If not history mode, only show active orders (not completed)
                if (!isHistory) {
                    filteredOrders = filteredOrders.filter(o => o.status !== 'COMPLETED');
                }

                if (filteredOrders.length === 0) {
                    addToast(isHistory ? 'No order history found' : 'No active orders found', 'info');
                    return;
                }
                const detailsPromises = filteredOrders.map(o => fetch(`/api/orders/${o.order_id}`).then(r => r.json()));
                const details = await Promise.all(detailsPromises);
                setOrdersList(details);
            } else {
                addToast('No order found', 'error');
            }
        } catch (err) {
            addToast('Search failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cancelOrder = async (orderId) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED', cancelled_by: 'customer' }),
            });
            const data = await res.json();
            if (res.ok) {
                setOrdersList(prev => prev.filter(item => item.order.order_id !== orderId));
                addToast('Order cancelled successfully', 'success');
            } else {
                addToast(data.error || 'Failed to cancel order', 'error');
            }
        } catch (err) {
            addToast('Failed to cancel order', 'error');
        }
    };

    return (
        <>
            <Navbar />
            <div className="track-page">
                <div className="container-sm">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Track Your Orders</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Mithila Medico — Enter your phone number to see all active orders.</p>
                    </div>

                    {/* Search */}
                    <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', marginBottom: '2rem' }}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Order ID or Phone Number"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
                                id="track-input"
                            />
                        </div>
                        <button className="btn btn-primary btn-full" onClick={searchOrder} disabled={loading} id="track-btn">
                            {loading ? 'Searching...' : 'Track Orders →'}
                        </button>
                    </div>

                    {/* Results */}
                    {searched && ordersList.length > 0 && (
                        <div className="track-results-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {ordersList.map(({ order, items }) => (
                                <div key={order.order_id} className="track-result glass-card">
                                    {order.status === 'CANCELLED' ? (
                                        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '1rem 2rem', background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)',
                                                color: 'var(--accent-red)', fontWeight: '600', fontSize: '1.1rem',
                                            }}>
                                                ❌ Order Cancelled
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="status-timeline" style={{ 
                                            display: 'flex', flexDirection: 'column', gap: '1rem', 
                                            background: 'var(--bg-secondary)', padding: '1.5rem', 
                                            borderRadius: 'var(--radius-md)', marginBottom: '1.5rem'
                                        }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Order Timeline</h3>
                                            {statuses.map((statusText, i) => {
                                                const currentIdx = getStatusIndex(order.status);
                                                const isActive = i <= currentIdx;
                                                const isCurrent = i === currentIdx;

                                                return (
                                                    <div key={statusText} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ 
                                                            width: '24px', height: '24px', 
                                                            borderRadius: '50%', 
                                                            background: isActive ? 'var(--accent-emerald)' : 'var(--border-color)',
                                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '12px', flexShrink: 0
                                                        }}>
                                                            {isActive ? '✓' : ''}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '1rem',
                                                            fontWeight: isCurrent ? '600' : '400',
                                                            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)'
                                                        }}>
                                                            {statusText}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Order Details */}
                                    <div style={{ marginTop: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{order.order_id}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.bill_number || 'Bill pending packing'}</div>
                                            </div>
                                            <span className={`badge ${order.status === 'PLACED' ? 'badge-progress' : order.status === 'PACKED' ? 'badge-packed' : order.status === 'CANCELLED' ? 'badge-cancelled' : 'badge-completed'}`}>
                                                {order.status === 'PLACED' ? 'Received' : order.status === 'PACKED' ? 'Packed' : order.status === 'COMPLETED' ? 'Collected' : 'Cancelled'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</div>
                                                <div style={{ fontWeight: '500' }}>{order.customer_name}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Phone</div>
                                                <div style={{ fontWeight: '500' }}>{order.phone}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Placed</div>
                                                <div style={{ fontWeight: '500' }}>{new Date(order.created_at).toLocaleString('en-IN')}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Items</div>
                                                <div style={{ fontWeight: '500' }}>{items?.length || 0} medicine(s)</div>
                                            </div>
                                        </div>

                                        {/* Medicines List */}
                                        {items && items.length > 0 && (
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Medicines Requested</div>
                                                {items.map((item, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '0.6rem 0', borderBottom: i < items.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                        fontSize: '0.9rem',
                                                    }}>
                                                        <span>{item.medicine_name} × {item.quantity}</span>
                                                        <span style={{ fontWeight: '600', color: item.line_total === null ? 'var(--text-muted)' : 'inherit' }}>
                                                            {item.line_total !== null && item.line_total !== 0
                                                                ? `₹${item.line_total.toFixed(2)}`
                                                                : "Price pending"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Total Payable</span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--accent-emerald)' }}>
                                                {['PACKED', 'COMPLETED'].includes(order.status) && order.final_amount
                                                    ? `₹${order.final_amount.toFixed(2)}`
                                                    : "Pending packing"}
                                            </span>
                                        </div>

                                        {order.status === 'PLACED' && (
                                            <div style={{
                                                marginTop: '1rem', padding: '1rem',
                                                background: 'rgba(21, 101, 192, 0.08)', border: '1px solid rgba(21, 101, 192, 0.15)',
                                                borderRadius: 'var(--radius-md)', textAlign: 'center',
                                                color: 'var(--accent-blue)', fontSize: '0.85rem'
                                            }}>
                                                🕒 Final bill will be generated once packing is complete.
                                            </div>
                                        )}

                                        {order.status === 'PACKED' && (
                                            <div style={{
                                                marginTop: '1rem', padding: '1rem',
                                                background: 'rgba(249, 168, 37, 0.1)', border: '1px solid rgba(249, 168, 37, 0.2)',
                                                borderRadius: 'var(--radius-md)', textAlign: 'center',
                                                color: 'var(--accent-amber)', fontWeight: '500',
                                            }}>
                                                📦 Your order is ready! Please collect from:<br />
                                                <strong style={{ fontSize: '0.9rem' }}>Mithila Medico, Gauriya Math, Gandhi Path, Jakkanpur, Gardanibagh</strong>
                                            </div>
                                        )}

                                        {['PACKED', 'COMPLETED'].includes(order.status) && (
                                            <button
                                                className="btn btn-secondary btn-full"
                                                style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                onClick={() => downloadInvoice(order, items)}
                                                id="download-invoice-btn"
                                            >
                                                📄 Download Invoice
                                            </button>
                                        )}

                                        {/* Cancel Button */}
                                        {['PLACED', 'PACKED'].includes(order.status) && (
                                            <button
                                                className="btn btn-danger btn-full"
                                                style={{ marginTop: '0.75rem' }}
                                                onClick={() => cancelOrder(order.order_id)}
                                                id="cancel-order-btn"
                                            >
                                                ❌ Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {searched && ordersList.length === 0 && !loading && (
                        <div className="empty-state" style={{ marginTop: '3rem' }}>
                            <div className="icon">🔍</div>
                            <h3>No Active Orders Found</h3>
                            <p style={{ marginTop: '0.5rem' }}>We couldn't track any active orders for this phone number.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function TrackPage() {
    return (
        <ToastProvider>
            <TrackContent />
        </ToastProvider>
    );
}

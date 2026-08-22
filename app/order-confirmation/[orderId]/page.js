'use client';

import { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';
import Link from 'next/link';

function OrderConfirmationContent({ orderId }) {
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const addToast = useToast();

    useEffect(() => {
        async function fetchOrder() {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                const data = await res.json();
                if (res.ok) { setOrder(data.order); setItems(data.items); }
                else { addToast('Order not found', 'error'); }
            } catch (err) { addToast('Failed to load order', 'error'); }
            finally { setLoading(false); }
        }
        fetchOrder();
    }, [orderId, addToast]);

    const generateWhatsAppLink = () => {
        if (!order) return '#';
        const itemsList = items.map((item, i) => `${i + 1}. ${item.medicine_name} × ${item.quantity}`).join('\n');
        const orderTime = new Date(order.created_at).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
        });
        const trackLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/track`;

        let message = '';
        if (order.status === 'PLACED') {
            message = `MITHILA MEDICO – ORDER RECEIVED

Hello ${order.customer_name},

Your order has been received successfully.

Order Number: #${order.order_id}
Time: ${orderTime}

Medicines Requested:
${itemsList}

Our staff will pack your medicines and generate the final bill.
You will receive a WhatsApp message once your order is ready.

Track your order here:
${trackLink}

Store Address:
Mithila Medico
Gauriya Math, Gandhi Path
Gardanibagh, Patna

Phone: 8579904555`;
        } else {
            message = `MITHILA MEDICO – ORDER CONFIRMATION

Hello ${order.customer_name},

Your order is ready.

Order Number: #${order.order_id}
Bill Number: ${order.bill_number}
Final Amount: ₹${order.final_amount?.toFixed(2)}

Please collect from:
Mithila Medico
Gauriya Math, Gandhi Path
Gardanibagh, Patna

Phone: 8579904555`;
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

    if (loading) return <div className="loading-page"><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>;
    if (!order) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <h2>Order Not Found</h2>
            <Link href="/" className="btn btn-primary">Go Back Home</Link>
        </div>
    );

    return (
        <>
            <Navbar />
            <div style={{ minHeight: '100vh', padding: '8rem 1.5rem 4rem' }}>
                <div className="container-sm">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{order.status === 'PLACED' ? '📩' : '✅'}</div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{order.status === 'PLACED' ? 'Order Received!' : 'Order Placed Successfully!'}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {order.status === 'PLACED'
                                ? <>Your order <strong style={{ color: 'var(--accent-blue)' }}>{order.order_id}</strong> has been received by Mithila Medico.</>
                                : <>Your order <strong style={{ color: 'var(--accent-blue)' }}>{order.order_id}</strong> has been confirmed at Mithila Medico.</>
                            }
                        </p>
                    </div>

                    <div className="invoice">
                        <div className="invoice-header">
                            <h2>🏥 MITHILA MEDICO</h2>
                            <div className="invoice-meta">
                                {order.status !== 'PLACED' && <div>Bill No: <strong>{order.bill_number}</strong></div>}
                                <div>Order ID: <strong>{order.order_id}</strong></div>
                                <div>{new Date(order.created_at).toLocaleString('en-IN')}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</div><div style={{ fontWeight: '600' }}>{order.customer_name}</div></div>
                            <div><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</div><div style={{ fontWeight: '600' }}>{order.phone}</div></div>
                        </div>

                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>Medicine</th>
                                    <th>Qty</th>
                                    {order.status !== 'PLACED' && (
                                        <>
                                            <th className="text-right">MRP</th>
                                            <th className="text-right">Disc.</th>
                                            <th className="text-right">Net</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.medicine_name}</td>
                                        <td>{item.quantity}</td>
                                        {order.status !== 'PLACED' && (
                                            <>
                                                <td className="text-right">₹{(item.mrp || 0).toFixed(2)}</td>
                                                <td className="text-right" style={{ color: 'var(--accent-amber)' }}>{item.discount_percent}%</td>
                                                <td className="text-right" style={{ fontWeight: '600' }}>₹{(item.line_total || 0).toFixed(2)}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {order.status !== 'PLACED' ? (
                            <div className="invoice-totals">
                                <div className="cart-summary-row"><span style={{ color: 'var(--text-secondary)' }}>Total MRP</span><span>₹{order.subtotal?.toFixed(2)}</span></div>
                                <div className="cart-summary-row"><span style={{ color: 'var(--text-secondary)' }}>Discount</span><span style={{ color: 'var(--accent-emerald)' }}>-₹{order.total_discount?.toFixed(2)}</span></div>
                                <div className="cart-summary-row total"><span>Final Payable</span><span style={{ color: 'var(--accent-emerald)', fontSize: '1.5rem' }}>₹{order.final_amount?.toFixed(2)}</span></div>
                            </div>
                        ) : (
                            <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    Our staff will pack your medicines and generate the final bill.
                                </p>
                                <p style={{ color: 'var(--accent-blue)', fontWeight: '500' }}>
                                    You will receive a WhatsApp message once your order is ready.
                                </p>
                            </div>
                        )}

                        <div style={{
                            marginTop: '1.5rem', padding: '1rem',
                            background: 'rgba(21, 101, 192, 0.08)', border: '1px solid rgba(21, 101, 192, 0.15)',
                            borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)',
                            textAlign: 'center', lineHeight: '1.7',
                        }}>
                            📍 Collect from: <strong>Mithila Medico, Gauriya Math, Gandhi Path, Jakkanpur, Gardanibagh, Patna</strong><br />
                            📞 8579904555 • Payment at store during collection
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
                        {order.status !== 'PLACED' && <button className="btn btn-primary" onClick={downloadInvoice}>📄 Download Invoice</button>}
                        <a href={generateWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="btn btn-success">
                            {order.status === 'PLACED' ? '💬 Share via WhatsApp' : '💬 Share Invoice via WhatsApp'}
                        </a>
                        <Link href="/track" className="btn btn-secondary">📦 Track Order</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function OrderConfirmationPage({ params }) {
    const resolvedParams = use(params);
    return <ToastProvider><OrderConfirmationContent orderId={resolvedParams.orderId} /></ToastProvider>;
}

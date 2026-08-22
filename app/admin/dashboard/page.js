'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ToastProvider, useToast } from '@/components/Toast';
import { DateRangeCalendar } from '@/components/DateRangeCalendar';
import ExpiryAlerts from '@/components/ExpiryAlerts';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, Users, ShoppingBag, Package,
    ArrowUpRight, ArrowDownRight, Activity, DollarSign,
    Eye, Edit, Printer, CheckCircle, Clock, PackageCheck, XCircle, ListFilter
} from 'lucide-react';

function BatchDatePicker({ value, onChange, label, required = false }) {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    useEffect(() => {
        if (value && value.includes('-')) {
            const [y, m, d] = value.split('-');
            setYear(y || '');
            setMonth(m || '');
            setDay(d || '');
        } else if (!value) {
            setDay('');
            setMonth('');
            setYear('');
        }
    }, [value]);

    const handleDayChange = (v) => {
        const val = v.replace(/\D/g, '').slice(0, 2);
        if (parseInt(val) > 31) return;
        setDay(val);
        updateDate(val, month, year);
    };

    const handleMonthChange = (v) => {
        const val = v.replace(/\D/g, '').slice(0, 2);
        if (parseInt(val) > 12) return;
        setMonth(val);
        updateDate(day, val, year);
    };

    const handleYearChange = (v) => {
        const val = v.replace(/\D/g, '').slice(0, 4);
        setYear(val);
        updateDate(day, month, val);
    };

    const updateDate = (d, m, y) => {
        if (d && m && y && y.length === 4) {
            onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        } else {
            onChange('');
        }
    };

    return (
        <div className="form-group">
            <label>{label} {required && '*'}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    placeholder="DD"
                    value={day}
                    onChange={(e) => handleDayChange(e.target.value)}
                    className="form-input"
                    style={{ width: '60px', textAlign: 'center' }}
                    required={required}
                />
                <input
                    type="text"
                    placeholder="MM"
                    value={month}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="form-input"
                    style={{ width: '60px', textAlign: 'center' }}
                    required={required}
                />
                <input
                    type="text"
                    placeholder="YYYY"
                    value={year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="form-input"
                    style={{ width: '100px', textAlign: 'center' }}
                    required={required}
                />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Format: Day / Month / Year
            </div>
        </div>
    );
}


function AdminDashboardContent() {
    const [staff, setStaff] = useState(null);
    const [stats, setStats] = useState({
        placed: 0, packed: 0, completed: 0, cancelled: 0,
        total_orders: 0, today_revenue: 0, week_revenue: 0, month_revenue: 0, total_revenue: 0, filtered_revenue: 0
    });
    const [topMedicines, setTopMedicines] = useState([]);
    const [dailySales, setDailySales] = useState([]);
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [dateRange, setDateRange] = useState('all');
    const [customDateRange, setCustomDateRange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');
    const [showTimeframePopover, setShowTimeframePopover] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);
    const [visibleDailyRows, setVisibleDailyRows] = useState(10);

    // Pagination and searching
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
    const [limit, setLimit] = useState(20);

    const addToast = useToast();

    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('staff');
        if (!stored) { router.push('/staff/login'); return; }
        const parsed = JSON.parse(stored);
        if (parsed.role !== 'admin') { router.push('/staff/dashboard'); return; }
        setStaff(parsed);
    }, [router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let statsUrl = `/api/stats?dateRange=${dateRange}`;
            let ordersUrl = `/api/orders?status=${filter}&search=${search}&sort=${sort}&dateRange=${dateRange}&page=${pagination.currentPage}&limit=${limit}`;
            let medsUrl = `/api/stats/medicines?dateRange=${dateRange}`;
            let dailyUrl = `/api/stats/daily-sales?dateRange=${dateRange}`;

            if (customDateRange) {
                statsUrl = `/api/stats?startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
                ordersUrl = `/api/orders?status=${filter}&search=${search}&sort=${sort}&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}&page=${pagination.currentPage}&limit=${limit}`;
                medsUrl = `/api/stats/medicines?startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
                dailyUrl = `/api/stats/daily-sales?startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
            }

            const [statsRes, ordersRes, medsRes, dailyRes] = await Promise.all([
                fetch(statsUrl),
                fetch(ordersUrl),
                fetch(medsUrl),
                fetch(dailyUrl)
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData.orders || []);
                if (ordersData.pagination) {
                    setPagination({
                        currentPage: ordersData.pagination.current_page,
                        totalPages: ordersData.pagination.total_pages,
                        totalCount: ordersData.pagination.total_count
                    });
                }
            }

            if (medsRes.ok) {
                const medsData = await medsRes.json();
                setTopMedicines(medsData.medicines || []);
            }

            if (dailyRes.ok) {
                const dailyData = await dailyRes.json();
                setDailySales(dailyData.data || []);
            }
        } catch (err) {
            console.error(err);
            addToast('Failed to fetch data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Live search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (staff) {
                setPagination(prev => ({ ...prev, currentPage: 1 }));
                fetchData();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (staff) fetchData();
    }, [staff, filter, sort, dateRange, customDateRange, pagination.currentPage]);

    const handleLogout = () => { localStorage.removeItem('staff'); router.push('/'); };

    const handleRangeSelect = (rangeData) => {
        setCustomDateRange(rangeData);
        setDateRange('custom');
        setShowTimeframePopover(false);
    };

    const handlePresetSelect = (preset) => {
        setDateRange(preset);
        setCustomDateRange(null);
        setShowTimeframePopover(false);
    };

    const getDateRangeLabel = () => {
        switch (dateRange) {
            case 'day': return 'Today';
            case 'yesterday': return 'Yesterday';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'all': return 'All Time';
            case 'custom':
                if (customDateRange) return `${customDateRange.startDate} to ${customDateRange.endDate}`;
                return 'Custom Range';
            default: return 'Timeframe';
        }
    };

    const clearCustomDate = () => {
        setCustomDateRange(null);
        setDateRange('all');
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

    if (!staff) return <div className="loading-page"><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <nav className="navbar scrolled" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                <div className="container">
                    <Link href="/admin/dashboard" className="logo">
                        <span className="logo-icon">🏥</span>
                        Mithila Medico <span style={{ fontWeight: '400', fontSize: '0.9rem', color: 'var(--accent-amber)', marginLeft: '0.5rem' }}>Owner Dashboard</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>👑 {staff.name} ({staff.staff_id})</span>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ padding: '2rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>MITHILA MEDICO — OWNER DASHBOARD</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Complete pharmacy analytics and order management.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>📅 Timeframe:</label>

                        <button
                            onClick={() => setShowTimeframePopover(!showTimeframePopover)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.85rem',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                minWidth: '180px',
                                justifyContent: 'space-between'
                            }}
                        >
                            <span>{getDateRangeLabel()}</span>
                            <span>{showTimeframePopover ? '▲' : '▼'}</span>
                        </button>

                        {showTimeframePopover && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                marginTop: '0.5rem',
                                background: 'var(--bg-primary, #0f0f1e)',
                                border: '1px solid var(--accent-blue)',
                                borderRadius: '12px',
                                padding: '1rem',
                                zIndex: 50,
                                display: 'flex',
                                gap: '1.5rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                minWidth: 'max-content'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Presets</h4>
                                    {['day', 'yesterday', 'week', 'month', 'all'].map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => handlePresetSelect(preset)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: dateRange === preset ? 'var(--accent-blue)' : 'transparent',
                                                color: dateRange === preset ? 'white' : 'var(--text-primary)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {preset === 'day' ? 'Today' :
                                                preset === 'yesterday' ? 'Yesterday' :
                                                    preset === 'week' ? 'This Week' :
                                                        preset === 'month' ? 'This Month' : 'All Time'}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Custom Range</h4>
                                    <DateRangeCalendar onRangeSelect={handleRangeSelect} />
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={() => setShowAlerts(true)}
                            className="btn btn-red"
                            style={{
                                padding: '0.6rem 1.25rem',
                                fontSize: '0.85rem',
                                background: 'var(--accent-red)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            ⚠️ Expiry Alerts
                        </button>
                    </div>
                </div>

                {showAlerts && <ExpiryAlerts onClose={() => setShowAlerts(false)} />}

                <div className="filters-bar" style={{ marginBottom: '2rem' }}>
                    <button className={`filter-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📦 Orders</button>
                    <button className={`filter-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Sales Analytics</button>
                    <button className={`filter-btn ${activeTab === 'medicines' ? 'active' : ''}`} onClick={() => setActiveTab('medicines')}>💊 Medicine Insights</button>
                    <button className={`filter-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>📋 Inventory</button>
                    <button className={`filter-btn ${activeTab === 'inv_logs' ? 'active' : ''}`} onClick={() => setActiveTab('inv_logs')}>📜 Inventory Logs</button>
                    <button className={`filter-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>📋 Order Logs</button>
                </div>

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && <InventoryPanel />}

                {/* INVENTORY LOGS TAB */}
                {activeTab === 'inv_logs' && <InventoryLogsPanel />}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <>
                        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Placed', key: 'placed', color: 'var(--accent-blue)', icon: <Clock size={20} /> },
                                { label: 'Packed', key: 'packed', color: 'var(--accent-amber)', icon: <Package size={20} /> },
                                { label: 'Completed', key: 'completed', color: 'var(--accent-emerald)', icon: <PackageCheck size={20} /> },
                                { label: 'Cancelled', key: 'cancelled', color: 'var(--accent-red)', icon: <XCircle size={20} /> }
                            ].map(status => {
                                const count = stats[status.key] || 0;
                                const total = stats.total_orders || 1;
                                const percentage = Math.round((count / total) * 100);
                                return (
                                    <div key={status.key} className="glass-card" style={{ marginBottom: 0, padding: '1.25rem', borderBottom: `3px solid ${status.color}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>{status.label}</span>
                                            <span style={{ color: status.color }}>{status.icon}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                            <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{count}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{percentage}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Live Search (Order ID, Name, Phone, Bill...)"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                                    />
                                </div>
                                <select className="form-input" style={{ width: 'auto', minWidth: '160px' }} value={sort} onChange={(e) => setSort(e.target.value)}>
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginRight: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Filters:</span>
                                {['', 'PLACED', 'PACKED', 'COMPLETED', 'CANCELLED'].map(st => (
                                    <button
                                        key={st}
                                        className={`filter-btn ${filter === st ? 'active' : ''}`}
                                        onClick={() => { setFilter(st); setPagination(p => ({ ...p, currentPage: 1 })); }}
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                    >
                                        {st || 'All Orders'}
                                    </button>
                                ))}
                                <div style={{ borderLeft: '1px solid var(--border-color)', height: '20px', margin: '0 0.5rem' }}></div>
                                <button
                                    className={`filter-btn ${dateRange === 'day' ? 'active' : ''}`}
                                    onClick={() => handlePresetSelect('day')}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                >
                                    Today
                                </button>
                                <button
                                    className={`filter-btn ${dateRange === 'week' ? 'active' : ''}`}
                                    onClick={() => handlePresetSelect('week')}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                >
                                    Last 7 Days
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div></div>
                        ) : orders.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">📦</div>
                                <h3>No orders found</h3>
                                <p>Try adjusting your filters or search terms.</p>
                            </div>
                        ) : (
                            <>
                                <div className="orders-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                                    {orders.map(order => (
                                        <Link key={order.order_id} href={`/staff/orders/${order.order_id}`}>
                                            <div className="order-card">
                                                <div className="order-card-header">
                                                    <div className="order-id">{order.order_id}</div>
                                                    <span className={`badge ${getBadgeClass(order.status)}`}>{order.status}</span>
                                                </div>
                                                <div className="order-card-body">
                                                    <div><div className="label">Customer</div><div>{order.customer_name}</div></div>
                                                    <div><div className="label">Phone</div><div>{order.phone}</div></div>
                                                    <div><div className="label">Bill No</div><div>{order.bill_number || '—'}</div></div>
                                                    <div><div className="label">Placed</div><div>{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div></div>
                                                </div>
                                                <div className="order-card-footer">
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click to manage →</span>
                                                    <span className="amount">₹{order.final_amount?.toFixed(2) || '0.00'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {pagination.totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                                        <button
                                            className="btn btn-secondary"
                                            disabled={pagination.currentPage === 1}
                                            onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
                                            style={{ padding: '0.5rem 1rem' }}
                                        >
                                            ← Prev
                                        </button>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
                                        </span>
                                        <button
                                            className="btn btn-secondary"
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                                            style={{ padding: '0.5rem 1rem' }}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* SALES ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Summary KPI Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div className="glass-card" style={{ marginBottom: 0, padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Revenue</span>
                                    <DollarSign size={18} color="var(--accent-emerald)" />
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.5rem' }}>₹{stats.filtered_revenue?.toFixed(2)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>In selected timeframe</div>
                            </div>
                            <div className="glass-card" style={{ marginBottom: 0, padding: '1.25rem', borderLeft: '4px solid var(--accent-blue)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Orders</span>
                                    <ShoppingBag size={18} color="var(--accent-blue)" />
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.5rem' }}>{stats.completed}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Completed transactions</div>
                            </div>
                            <div className="glass-card" style={{ marginBottom: 0, padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avg. Order Value</span>
                                    <TrendingUp size={18} color="var(--accent-amber)" />
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.5rem' }}>₹{stats.aov?.toFixed(2)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Revenue / Orders</div>
                            </div>
                            <div className="glass-card" style={{ marginBottom: 0, padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Units Sold</span>
                                    <Package size={18} color="var(--accent-purple)" />
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.5rem' }}>{stats.total_units}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total quantities sold</div>
                            </div>
                        </div>

                        {/* Trend Chart */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <TrendingUp size={18} /> Sales Performance Trend
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily Revenue (₹)</div>
                            </div>
                            <div style={{ height: '300px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailySales}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="var(--text-muted)"
                                            fontSize={11}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="var(--text-muted)"
                                            fontSize={11}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => `₹${val}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ background: '#1a1a2e', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                            itemStyle={{ color: 'var(--accent-emerald)' }}
                                            labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
                                            formatter={(value) => [`₹${parseFloat(value).toFixed(2)}`, 'Revenue']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="var(--accent-emerald)"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: 'var(--accent-emerald)', strokeWidth: 2, stroke: '#1a1a2e' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bottom Grid: Top Meds & Status Breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                            {/* Top Medicines Compact */}
                            <div className="glass-card" style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>🏆 Top Selling Medicines (Top 5)</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="invoice-table" style={{ fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr>
                                                <th>Medicine</th>
                                                <th className="text-right">Units</th>
                                                <th className="text-right">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topMedicines.slice(0, 5).map((med, i) => (
                                                <tr key={i}>
                                                    <td>{med.medicine_name}</td>
                                                    <td className="text-right" style={{ fontWeight: '600' }}>{med.total_quantity}</td>
                                                    <td className="text-right" style={{ color: 'var(--accent-emerald)' }}>₹{med.total_revenue?.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {topMedicines.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Status Breakdown */}
                            <div className="glass-card" style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>📋 Order Status Pipeline</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {[
                                        { label: 'Placed', count: stats.placed, color: 'var(--accent-blue)' },
                                        { label: 'Packed', count: stats.packed, color: 'var(--accent-amber)' },
                                        { label: 'Completed', count: stats.completed, color: 'var(--accent-emerald)' },
                                        { label: 'Cancelled', count: stats.cancelled, color: 'var(--accent-red)' }
                                    ].map((st, i) => {
                                        const max = Math.max(stats.placed, stats.packed, stats.completed, stats.cancelled, 1);
                                        const percent = (st.count / max) * 100;
                                        return (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                    <span>{st.label}</span>
                                                    <span style={{ fontWeight: '600' }}>{st.count}</span>
                                                </div>
                                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${percent}%`, height: '100%', background: st.color, borderRadius: '3px' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Daily Sales Table */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📅 Daily Performance Breakdown</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="invoice-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th className="text-right">Orders</th>
                                            <th className="text-right">Units Sold</th>
                                            <th className="text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailySales.slice().reverse().slice(0, visibleDailyRows).map((day, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '500' }}>{new Date(day.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                                                <td className="text-right">{day.orders}</td>
                                                <td className="text-right">{day.units}</td>
                                                <td className="text-right" style={{ fontWeight: '600', color: 'var(--accent-emerald)' }}>₹{day.revenue?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {dailySales.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No data for selected period</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            {dailySales.length > visibleDailyRows && (
                                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setVisibleDailyRows(prev => prev + 20)}
                                        style={{ padding: '0.5rem 2rem', fontSize: '0.9rem' }}
                                    >
                                        Show More Records
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MEDICINE INSIGHTS TAB */}
                {activeTab === 'medicines' && (
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>🏆 Top 20 Most Sold Medicines ({dateRange})</h3>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div></div>
                        ) : topMedicines.length === 0 ? (
                            <div className="empty-state" style={{ padding: '2rem' }}><div className="icon">💊</div><h3>No data for this period</h3><p>Medicine insights will update as orders are processed.</p></div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="invoice-table">
                                    <thead><tr><th>#</th><th>Medicine Name</th><th className="text-right">Qty Sold</th><th className="text-right">Revenue Generated</th></tr></thead>
                                    <tbody>
                                        {topMedicines.map((med, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '600', color: i < 3 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
                                                <td style={{ fontWeight: '500' }}>{med.medicine_name}</td>
                                                <td className="text-right" style={{ fontWeight: '600' }}>{med.total_quantity}</td>
                                                <td className="text-right" style={{ fontWeight: '600', color: 'var(--accent-emerald)' }}>₹{med.total_revenue?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ORDER LOGS TAB */}
                {activeTab === 'logs' && <AdminOrderLogsPanel dateRange={dateRange} />}
            </div>
        </div>
    );
}

function InventoryPanel() {
    const [medicines, setMedicines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedMed, setExpandedMed] = useState(null);
    const [restockingId, setRestockingId] = useState(null); // Used for modifying existing batch stock
    const [addingBatchMedId, setAddingBatchMedId] = useState(null); // Used for adding a new batch to a medicine
    const [restockData, setRestockData] = useState({
        quantity: '', mfd_date: '', expiry_date: '', batch_no: '', mrp: '', discount_percent: '0', type: 'add', reason: ''
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMedicine, setNewMedicine] = useState({
        name: '', category: '', mrp: '', discount_percent: '0',
        stock_quantity: '', low_stock_threshold: '10',
        mfd_date: '', expiry_date: '', batch_no: ''
    });
    const addToast = useToast();

    useEffect(() => {
        fetchInventory();
        fetchCategories();
    }, [category]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/medicines/inventory?q=${search}&category=${category}`);
            const data = await res.json();
            setMedicines(data.medicines || []);
        } catch (err) {
            addToast('Failed to fetch inventory', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/medicines');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories');
        }
    };

    const handleRestock = async (e) => {
        e.preventDefault();
        if (restockData.quantity === '' || isNaN(parseInt(restockData.quantity))) return addToast('Enter valid quantity', 'error');

        try {
            let res;
            if (restockingId) {
                // Adjusting or Editing an existing batch
                const isEdit = restockData.type === 'edit';
                res = await fetch(`/api/batches/${restockingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        is_edit: isEdit,
                        type: isEdit ? 'add' : restockData.type,
                        quantity: isEdit ? 0 : parseInt(restockData.quantity),
                        reason: restockData.reason,
                        batch_no: restockData.batch_no,
                        mrp: parseFloat(restockData.mrp),
                        discount_percent: parseFloat(restockData.discount_percent) || 0,
                        mfd_date: restockData.mfd_date,
                        expiry_date: restockData.expiry_date,
                        stock: isEdit ? parseInt(restockData.quantity) : undefined
                    })
                });
            } else if (addingBatchMedId) {
                // Adding a brand new batch to a medicine
                if (!restockData.batch_no || !restockData.mrp || !restockData.expiry_date) {
                    return addToast('Please fill all required fields', 'error');
                }
                res = await fetch('/api/batches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        medicine_id: addingBatchMedId,
                        batch_no: restockData.batch_no,
                        mrp: parseFloat(restockData.mrp),
                        discount_percent: parseFloat(restockData.discount_percent) || 0,
                        mfd_date: restockData.mfd_date,
                        expiry_date: restockData.expiry_date,
                        stock: parseInt(restockData.quantity) || 0
                    })
                });
            }

            if (res.ok) {
                addToast('Inventory updated', 'success');
                setRestockingId(null);
                setAddingBatchMedId(null);
                setRestockData({ quantity: '', mfd_date: '', expiry_date: '', batch_no: '', mrp: '', discount_percent: '0', type: 'add', reason: '' });
                fetchInventory();
            } else {
                const data = await res.json();
                addToast(data.error || 'Update failed', 'error');
            }
        } catch (err) {
            addToast('Update failed', 'error');
        }
    };

    const handleDeleteBatch = async (batchId) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this batch and all its history? This cannot be undone.')) return;
        
        try {
            const res = await fetch(`/api/batches/${batchId}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Batch permanently deleted', 'success');
                fetchInventory();
            } else {
                const data = await res.json();
                addToast(data.error || 'Delete failed', 'error');
            }
        } catch (err) {
            addToast('Delete failed', 'error');
        }
    };

    const handleDeleteMedicine = async (medId, medName) => {
        if (!confirm(`PERMANENT DELETE: Are you sure you want to delete ${medName}? This will also delete ALL its batches and history. This action cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/medicines/${medId}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Medicine and all associated data deleted', 'success');
                fetchInventory();
            } else {
                const data = await res.json();
                addToast(data.error || 'Delete failed', 'error');
            }
        } catch (err) {
            addToast('Delete failed', 'error');
        }
    };

    const openAdjustModal = (batch) => {
        setRestockingId(batch.batch_id); // Use batch_id correctly
        setAddingBatchMedId(null);
        setRestockData({ 
            quantity: batch.stock_quantity || 0, 
            type: 'edit', // Default to edit mode
            reason: '', 
            batch_no: batch.batch_no,
            mrp: batch.mrp,
            discount_percent: batch.batch_discount || 0,
            mfd_date: batch.mfd_date || '',
            expiry_date: batch.expiry_date || '',
            is_used: batch.is_used
        });
    };

    const openAddBatchModal = (medId) => {
        setAddingBatchMedId(medId);
        setRestockingId(null);
        setRestockData({
            quantity: '', mfd_date: '', expiry_date: '', batch_no: '', mrp: '', discount_percent: '0', type: 'add', reason: ''
        });
    };

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/medicines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMedicine)
            });
            const data = await res.json();
            if (res.ok) {
                addToast('Medicine added successfully', 'success');
                setShowAddModal(false);
                setNewMedicine({
                    name: '', category: '', mrp: '', discount_percent: '0',
                    stock_quantity: '', low_stock_threshold: '10',
                    mfd: '', expiry_date: '', batch_no: ''
                });
                fetchInventory();
                fetchCategories();
            } else {
                addToast(data.error || 'Failed to add medicine', 'error');
            }
        } catch (err) {
            addToast('Something went wrong', 'error');
        }
    };

    // Group medicines by name
    const groupedMedicines = medicines.reduce((acc, med) => {
        if (!acc[med.name]) {
            acc[med.name] = {
                name: med.name,
                category: med.category,
                id: med.id, // Reference ID for restocking
                totalStock: 0,
                low_stock_threshold: med.low_stock_threshold || 10,
                batches: []
            };
        }
        acc[med.name].totalStock += med.stock_quantity;
        acc[med.name].batches.push(med);
        return acc;
    }, {});

    const medicineList = Object.values(groupedMedicines);

    return (
        <div>
            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" className="form-input" placeholder="Search medicine..." value={search}
                        onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                        style={{ flex: 1, minWidth: '200px' }} />
                    <select className="form-input" style={{ width: 'auto', minWidth: '160px' }} value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={fetchInventory}>Search</button>
                    <button className="btn btn-success" style={{ marginLeft: 'auto' }} onClick={() => setShowAddModal(true)}>+ Add Medicine</button>
                </div>
            </div>

            <div className="glass-card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Medicine Name</th>
                                <th>Category</th>
                                <th className="text-right">Total Stock</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner"></div></td></tr>
                            ) : medicineList.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No items found</td></tr>
                            ) : (
                                medicineList.map(medGroup => (
                                    <React.Fragment key={medGroup.name}>
                                        <tr style={{ cursor: 'pointer', borderLeft: expandedMed === medGroup.name ? '4px solid var(--accent-emerald)' : 'none' }}>
                                            <td onClick={() => setExpandedMed(expandedMed === medGroup.name ? null : medGroup.name)}>
                                                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {expandedMed === medGroup.name ? '▼' : '▶'} {medGroup.name}
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        background: '#1e293b', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '6px', 
                                                        fontWeight: '600',
                                                        color: 'var(--text-secondary)',
                                                        marginLeft: '4px'
                                                    }}>
                                                        {medGroup.batches.length} {medGroup.batches.length === 1 ? 'batch' : 'batches'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>{medGroup.category}</span></td>
                                            <td className="text-right">
                                                <span style={{ 
                                                    fontWeight: '700', 
                                                    color: medGroup.totalStock <= medGroup.low_stock_threshold ? 'var(--accent-red)' : 'var(--accent-emerald)' 
                                                }}>
                                                    {medGroup.totalStock}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); openAddBatchModal(medGroup.id); }}>+ Batch</button>
                                                    <button className="btn btn-outline-red" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); handleDeleteMedicine(medGroup.id, medGroup.name); }}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedMed === medGroup.name && (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        {medGroup.batches.map(batch => (
                                                            <div key={batch.batch_id} className="glass-card" style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 0 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                                    <span style={{ fontWeight: '600', color: 'var(--accent-emerald)' }}>Batch: {batch.batch_no}</span>
                                                                    <span style={{ fontWeight: '700' }}>{batch.stock_quantity} Qty</span>
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                    <div>MFD: {batch.mfd_date || 'N/A'}</div>
                                                                    <div>EXP: {batch.expiry_date || 'N/A'}</div>
                                                                    <div style={{ marginTop: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.3rem' }}>
                                                                        MRP: ₹{batch.mrp?.toFixed(2) || '0.00'}{' | '}
                                                                        Discount: {batch.batch_discount || 0}%
                                                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                            <button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }} onClick={() => openAdjustModal(batch)}>Edit</button>
                                                                            <button className="btn btn-outline-red" style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }} onClick={() => handleDeleteBatch(batch.batch_id || batch.id)}>Delete</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            { (restockingId || addingBatchMedId) && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 2000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ 
                        maxWidth: '700px', width: '100%', 
                        maxHeight: '90vh', overflowY: 'auto', padding: '2rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>
                                {restockingId ? `Edit Batch: ${restockData.batch_no}` : 'Add New Batch'}
                            </h2>
                            <button type="button" onClick={() => { setRestockingId(null); setAddingBatchMedId(null); }} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleRestock}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {restockingId ? (
                                    <>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>Operation Mode</label>
                                            <select className="form-input" value={restockData.type} onChange={(e) => {
                                                const newType = e.target.value;
                                                setRestockData({
                                                    ...restockData, 
                                                    type: newType,
                                                    // If switching from edit to adjustment, clear quantity. 
                                                    // If switching TO edit, we don't have the original stock here easily without the batch object, 
                                                    // but usually they stay in edit mode or switch away from it.
                                                    quantity: newType === 'edit' ? restockData.quantity : '' 
                                                });
                                            }}>
                                                <option value="edit">Edit Details (Correct Mistakes)</option>
                                                <option value="add">Add Stock (+)</option>
                                                <option value="remove">Remove Stock (-)</option>
                                            </select>
                                        </div>
                                        {restockData.type === 'edit' ? (
                                            <>
                                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                    <label>Batch No * {restockData.is_used && <span style={{fontSize: '0.7rem', color: 'var(--accent-amber)'}}>(Locked: used in orders)</span>}</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-input" 
                                                        required 
                                                        value={restockData.batch_no} 
                                                        onChange={(e) => setRestockData({...restockData, batch_no: e.target.value})} 
                                                        disabled={restockData.is_used}
                                                        style={{ opacity: restockData.is_used ? 0.7 : 1, cursor: restockData.is_used ? 'not-allowed' : 'text' }}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>MRP *</label>
                                                    <input type="number" step="0.01" className="form-input" required value={restockData.mrp} onChange={(e) => setRestockData({...restockData, mrp: e.target.value})} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Discount %</label>
                                                    <input type="number" step="0.1" className="form-input" value={restockData.discount_percent} onChange={(e) => setRestockData({...restockData, discount_percent: e.target.value})} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Current Stock *</label>
                                                    <input type="number" className="form-input" required value={restockData.quantity} onChange={(e) => setRestockData({...restockData, quantity: e.target.value})} />
                                                </div>
                                                <div className="form-group">
                                                    <BatchDatePicker
                                                        label="MFD Date"
                                                        value={restockData.mfd_date}
                                                        onChange={(val) => setRestockData({...restockData, mfd_date: val})}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <BatchDatePicker
                                                        label="Expiry Date *"
                                                        required
                                                        value={restockData.expiry_date}
                                                        onChange={(val) => setRestockData({...restockData, expiry_date: val})}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                    <label>Quantity to {restockData.type === 'add' ? 'Add' : 'Remove'} *</label>
                                                    <input type="number" className="form-input" required value={restockData.quantity} onChange={(e) => setRestockData({...restockData, quantity: e.target.value})} autoFocus />
                                                </div>
                                            </>
                                        )}
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>Reason / Note</label>
                                            <input type="text" className="form-input" placeholder="e.g. Broken stock, Typo..." value={restockData.reason} onChange={(e) => setRestockData({...restockData, reason: e.target.value})} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>Initial Quantity *</label>
                                            <input type="number" className="form-input" required value={restockData.quantity} onChange={(e) => setRestockData({...restockData, quantity: e.target.value})} autoFocus />
                                        </div>
                                        <div className="form-group">
                                            <label>Batch No *</label>
                                            <input type="text" className="form-input" required value={restockData.batch_no} onChange={(e) => setRestockData({...restockData, batch_no: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>MRP *</label>
                                            <input type="number" step="0.01" className="form-input" required value={restockData.mrp} onChange={(e) => setRestockData({...restockData, mrp: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Discount %</label>
                                            <input type="number" step="0.1" min="0" max="100" className="form-input" value={restockData.discount_percent} onChange={(e) => setRestockData({...restockData, discount_percent: e.target.value})} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <BatchDatePicker
                                                label="Manufacturing Date"
                                                value={restockData.mfd_date}
                                                onChange={(val) => setRestockData({...restockData, mfd_date: val})}
                                            />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <BatchDatePicker
                                                label="Expiry Date"
                                                required
                                                value={restockData.expiry_date}
                                                onChange={(val) => setRestockData({...restockData, expiry_date: val})}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary btn-full" onClick={() => { setRestockingId(null); setAddingBatchMedId(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-full">Confirm Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 2000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ 
                        maxWidth: '700px', width: '100%', 
                        maxHeight: '90vh', overflowY: 'auto', padding: '2rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Add New Medicine</h2>
                            <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleAddMedicine}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Medicine Name *</label>
                                    <input type="text" className="form-input" required value={newMedicine.name} onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Category *</label>
                                    <input type="text" className="form-input" required list="categories-list" value={newMedicine.category} onChange={(e) => setNewMedicine({...newMedicine, category: e.target.value})} />
                                    <datalist id="categories-list">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label>Batch No *</label>
                                    <input type="text" className="form-input" required value={newMedicine.batch_no} onChange={(e) => setNewMedicine({...newMedicine, batch_no: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>MRP (Price) *</label>
                                    <input type="number" step="0.01" className="form-input" required value={newMedicine.mrp} onChange={(e) => setNewMedicine({...newMedicine, mrp: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Discount (%)</label>
                                    <input type="number" className="form-input" value={newMedicine.discount_percent} onChange={(e) => setNewMedicine({...newMedicine, discount_percent: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Initial Quantity *</label>
                                    <input type="number" className="form-input" required value={newMedicine.stock_quantity} onChange={(e) => setNewMedicine({...newMedicine, stock_quantity: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Low Stock Threshold</label>
                                    <input type="number" className="form-input" value={newMedicine.low_stock_threshold} onChange={(e) => setNewMedicine({...newMedicine, low_stock_threshold: e.target.value})} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <BatchDatePicker
                                        label="Manufacturing Date"
                                        value={newMedicine.mfd_date}
                                        onChange={(val) => setNewMedicine({...newMedicine, mfd_date: val})}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <BatchDatePicker
                                        label="Expiry Date"
                                        required
                                        value={newMedicine.expiry_date}
                                        onChange={(val) => setNewMedicine({...newMedicine, expiry_date: val})}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-full">Save Medicine</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminOrderLogsPanel({ dateRange, customDateRange }) {
    const [logs, setLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchLogs(); }, [logFilter, dateRange, customDateRange]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = `/api/orders?sort=newest&dateRange=${dateRange}`;
            if (customDateRange) {
                url = `/api/orders?sort=newest&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            const allOrders = data.orders || [];

            // To get logs, we need detailed order info. We limit to recent 50 orders to avoid flooding.
            const logsPromises = allOrders.slice(0, 50).map(o =>
                fetch(`/api/orders/${o.id}`).then(r => r.json())
            );

            const results = await Promise.all(logsPromises);
            const allLogs = [];
            results.forEach(r => {
                if (r.logs) {
                    r.logs.forEach(log => {
                        const action = log.action.toLowerCase();
                        let include = false;

                        if (!logFilter) {
                            include = true;
                        } else if (logFilter === 'PLACED' && (action.includes('created') || action.includes('received'))) {
                            include = true;
                        } else if (logFilter === 'PACKED' && action.includes('packed')) {
                            include = true;
                        } else if (logFilter === 'COMPLETED' && action.includes('completed')) {
                            include = true;
                        } else if (logFilter === 'CANCELLED' && (action.includes('cancelled') || action.includes('cancel'))) {
                            include = true;
                        }

                        if (include) {
                            allLogs.push({
                                ...log,
                                order_id: r.order?.id,
                                status: r.order?.status,
                                cancelled_by: r.order?.cancelled_by
                            });
                        }
                    });
                }
            });

            allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setLogs(allLogs);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="filters-bar" style={{ marginBottom: '1.5rem' }}>
                {['', 'PLACED', 'PACKED', 'COMPLETED', 'CANCELLED'].map(st => (
                    <button key={st} className={`filter-btn ${logFilter === st ? 'active' : ''}`} onClick={() => setLogFilter(st)}>
                        {st || 'All Statuses'}
                    </button>
                ))}
            </div>
            <div className="glass-card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Activity History ({dateRange})</h3>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }}></div></div>
                ) : logs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No activity logs found for this period.</p>
                ) : (
                    <div className="logs-container">
                        {logs.map((log, i) => (
                            <div key={i} className="log-entry" style={{
                                padding: '0.75rem 0',
                                borderBottom: '1px solid var(--border-color)',
                                opacity: log.action.includes('cancelled') ? 0.9 : 1
                            }}>
                                <div className="log-action">
                                    <span style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>{log.order_id}</span>
                                    {' — '}
                                    <span style={{ color: log.action.includes('cancelled') ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                                        {log.action}
                                    </span>
                                </div>
                                <div className="log-meta" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Performed by: <strong style={{ color: 'var(--text-secondary)' }}>{log.performed_by}</strong>
                                    {log.action.includes('cancelled') && log.cancelled_by && (
                                        <span style={{ marginLeft: '0.5rem', color: 'var(--accent-red)', fontSize: '0.7rem' }}>
                                            (Type: {log.cancelled_by})
                                        </span>
                                    )}
                                    <span style={{ margin: '0 0.5rem' }}>•</span>
                                    {new Date(log.timestamp).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return <ToastProvider><AdminDashboardContent /></ToastProvider>;
}

function InventoryLogsPanel() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const addToast = useToast();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory/logs');
            const data = await res.json();
            if (res.ok) setLogs(data.logs || []);
            else addToast(data.error || 'Failed to fetch logs', 'error');
        } catch (err) {
            addToast('Connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📜 Inventory Audit Logs (Last 100 Changes)</h3>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={fetchLogs}>Refresh</button>
            </div>
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner"></div></div>
            ) : logs.length === 0 ? (
                <div className="empty-state">No inventory changes recorded yet.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Medicine</th>
                                <th>Batch</th>
                                <th>Action</th>
                                <th className="text-right">Qty Change</th>
                                <th>Reason / Performed By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={i}>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {new Date(log.created_at).toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{log.medicine_name}</td>
                                    <td><span className="badge" style={{ background: '#1e293b' }}>{log.batch_no}</span></td>
                                    <td>
                                        <span className={`badge ${
                                            log.change_type === 'ADD_STOCK' ? 'badge-completed' : 
                                            log.change_type === 'REMOVE_STOCK' ? 'badge-cancelled' : 'badge-progress'
                                        }`} style={{ fontSize: '0.65rem' }}>
                                            {log.change_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="text-right" style={{ 
                                        fontWeight: '700', 
                                        color: log.quantity_added > 0 ? 'var(--accent-emerald)' : log.quantity_added < 0 ? 'var(--accent-red)' : 'inherit' 
                                    }}>
                                        {log.quantity_added > 0 ? `+${log.quantity_added}` : log.quantity_added}
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>{log.reason || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider, useToast } from '@/components/Toast';

function LoginContent() {
    const [staffId, setStaffId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const addToast = useToast();
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!staffId.trim() || !password.trim()) return addToast('Please fill all fields', 'error');

        setLoading(true);
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffId, password }),
            });
            const data = await res.json();
            if (res.ok && data.authenticated) {
                localStorage.setItem('staff', JSON.stringify(data));
                addToast(`Welcome, ${data.name}!`, 'success');
                if (data.role === 'admin') router.push('/admin/dashboard');
                else router.push('/staff/dashboard');
            } else {
                addToast(data.error || 'Invalid credentials', 'error');
            }
        } catch (err) { addToast('Login failed', 'error'); }
        finally { setLoading(false); }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏥</div>
                    <h1>Mithila Medico</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>Staff / Admin Portal</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="staff-id">User ID</label>
                        <input type="text" id="staff-id" className="form-input" placeholder="e.g. ADMIN001 or STAFF001" value={staffId} onChange={(e) => setStaffId(e.target.value)} autoComplete="username" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="staff-password">Password</label>
                        <input type="password" id="staff-password" className="form-input" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="staff-login-btn">
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Demo Credentials</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div>Owner: <strong>ADMIN001</strong> / <strong>admin123</strong></div>
                        <div>Staff: <strong>STAFF001</strong> / <strong>staff123</strong></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StaffLoginPage() {
    return <ToastProvider><LoginContent /></ToastProvider>;
}

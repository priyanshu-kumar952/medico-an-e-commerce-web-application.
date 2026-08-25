'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const [prevPathname, setPrevPathname] = useState(pathname);
    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setIsMenuOpen(false);
    }

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        handleScroll(); // check initial scroll position
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleHomeClick = (e) => {
        e.preventDefault();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('staff');
        }
        setIsMenuOpen(false);
        router.push('/');
    };

    const isStaffArea = pathname?.startsWith('/staff') || pathname?.startsWith('/admin');

    return (
        <nav className={`navbar ${scrolled || isStaffArea ? 'scrolled' : ''}`}>
            <div className="container">
                <Link href="/" onClick={handleHomeClick} className="logo">
                    <span className="logo-icon">🏥</span>
                    Mithila Medico
                </Link>

                <button
                    className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
                    <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
                    <Link href="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link>
                    <Link href="/track" onClick={() => setIsMenuOpen(false)}>Track Order</Link>
                    <Link href="/history" onClick={() => setIsMenuOpen(false)}>Previous Orders</Link>
                    <Link href="/#order-section" onClick={() => setIsMenuOpen(false)}>Order Medicines</Link>
                    <Link href="/staff/login" className="btn-sm" onClick={() => setIsMenuOpen(false)}>Staff Login</Link>
                </div>
            </div>
        </nav>
    );
}

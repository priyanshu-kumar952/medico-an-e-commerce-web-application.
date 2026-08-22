'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <>
            <Navbar />

            {/* Hero Banner */}
            <section className="about-hero">
                <div className="about-hero-content">
                    <div className="hero-badge">
                        <span className="dot"></span>
                        About Us
                    </div>
                    <h1>Mithila Medico</h1>
                    <p>Your Trusted Neighbourhood Pharmacy in Gardanibagh, Patna<br />Serving since 1994</p>
                </div>
            </section>

            {/* Pharmacy Info */}
            <section className="section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                <div className="container">
                    <div className="about-grid">
                        {/* Info Card */}
                        <div className="glass-card about-info-card">
                            <div className="about-info-icon">🏥</div>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Mithila Medico</h2>
                            <p style={{ color: 'var(--accent-amber)', fontWeight: '500', fontSize: '0.9rem', marginBottom: '1.5rem' }}>ESTD 1994</p>

                            <div className="about-info-list">
                                <div className="about-info-item">
                                    <div className="about-info-label">📍 Address</div>
                                    <div className="about-info-value">
                                        Gauriya Math, Gandhi Path<br />
                                        Jakkanpur, Gardanibagh<br />
                                        Patna, Bihar 800001
                                    </div>
                                </div>
                                <div className="about-info-item">
                                    <div className="about-info-label">📞 Contact</div>
                                    <div className="about-info-value">
                                        <a href="tel:8579904555" style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>8579904555</a>
                                    </div>
                                </div>
                                <div className="about-info-item">
                                    <div className="about-info-label">🏪 Store Type</div>
                                    <div className="about-info-value">Local Retail Pharmacy with Pickup Model</div>
                                </div>
                                <div className="about-info-item">
                                    <div className="about-info-label">💰 Discount</div>
                                    <div className="about-info-value">Cash discount available (0–20% depending on medicine)</div>
                                </div>
                                <div className="about-info-item">
                                    <div className="about-info-label">🚚 Delivery</div>
                                    <div className="about-info-value">Free home delivery available</div>
                                </div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div>
                            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>🏥 Who We Are</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.95rem' }}>
                                    Mithila Medico has been serving the Gardanibagh area of Patna since 1994.
                                </p>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.95rem', marginTop: '1rem' }}>
                                    We provide genuine medicines, monthly medicine discounts, and reliable service to our
                                    customers. Our goal is to make medicine purchasing simple and transparent.
                                </p>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.95rem', marginTop: '1rem' }}>
                                    Customers can place orders online and collect them directly from the pharmacy once packed.
                                </p>
                            </div>

                            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>⚡ Why Choose Us</h3>
                                <div className="about-features-list">
                                    <div className="about-feature-item">
                                        <span className="about-feature-check">✓</span>
                                        <span>Serving since 1994 — over 30 years of trust</span>
                                    </div>
                                    <div className="about-feature-item">
                                        <span className="about-feature-check">✓</span>
                                        <span>Genuine medicines from verified sources</span>
                                    </div>
                                    <div className="about-feature-item">
                                        <span className="about-feature-check">✓</span>
                                        <span>Cash discounts available on medicines</span>
                                    </div>
                                    <div className="about-feature-item">
                                        <span className="about-feature-check">✓</span>
                                        <span>Quick packing and pickup</span>
                                    </div>
                                    <div className="about-feature-item">
                                        <span className="about-feature-check">✓</span>
                                        <span>Free home delivery in Gardanibagh area</span>
                                    </div>
                                    <div className="about-feature-item">
                                        <span className="about-feature-check">✓</span>
                                        <span>Real-time order tracking</span>
                                    </div>
                                </div>
                            </div>

                            {/* Map Embed */}
                            <div className="glass-card">
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>📍 Find Us</h3>
                                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3597.9!2d85.155!3d25.596!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDM1JzQ1LjYiTiA4NcKwMDknMTguMCJF!5e0!3m2!1sen!2sin!4v1709471234567!5m2!1sen!2sin"
                                        width="100%" height="250" style={{ border: 0 }} allowFullScreen="" loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
                        <Link href="/#order-section" className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
                            💊 Order Medicines →
                        </Link>
                        <a href="tel:8579904555" className="btn btn-secondary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem', background: 'rgba(46, 125, 50, 0.15)', borderColor: 'rgba(46, 125, 50, 0.3)', color: '#66BB6A' }}>
                            📞 Call Pharmacy
                        </a>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="container">
                    <p>© 2026 Mithila Medico — Serving Patna Since 1994</p>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>Gauriya Math, Gandhi Path, Gardanibagh, Patna • 📞 8579904555</p>
                </div>
            </footer>
        </>
    );
}

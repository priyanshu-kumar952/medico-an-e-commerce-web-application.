'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';

function HomePage() {
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const searchRef = useRef(null);
  const addToast = useToast();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search medicines
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 1) {
        try {
          const res = await fetch(`/api/medicines?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setSearchResults(data.medicines || []);
          setShowResults(true);
        } catch (err) {
          console.error('Search error:', err);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addToCart = (medicine) => {
    const stock = medicine.total_stock !== undefined ? medicine.total_stock : medicine.stock_quantity;
    const existing = cart.find(item => item.medicine_id === medicine.id);
    
    if (existing) {
      if (existing.quantity >= stock) {
        addToast(`Only ${stock} units available in stock`, 'error');
        return;
      }
      setCart(cart.map(item =>
        item.medicine_id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (stock <= 0) {
        addToast(`Medicine is out of stock`, 'error');
        return;
      }
      setCart([...cart, {
        medicine_id: medicine.id,
        name: medicine.name,
        category: medicine.category,
        quantity: 1,
        total_stock: stock // Store for easier reference
      }]);
    }
    setSearchQuery('');
    setShowResults(false);
    addToast(`${medicine.name} added to cart`, 'success');
  };

  const updateQuantity = (medicineId, delta) => {
    setCart(cart.map(item => {
      if (item.medicine_id === medicineId) {
        const newQty = item.quantity + delta;
        if (delta > 0 && newQty > item.total_stock) {
          addToast(`Maximum available stock reached`, 'error');
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.medicine_id !== medicineId));
  };

  // Removed pricing calculations from frontend

  const placeOrder = async () => {
    if (!customerName.trim()) return addToast('Please enter your name', 'error');

    const phoneTrimmed = phone.trim();
    const phoneRegex = /^[6-9]\d{9}$/;
    const isRepeated = /^(.)\1{9}$/.test(phoneTrimmed);

    if (!phoneRegex.test(phoneTrimmed) || isRepeated) {
      return addToast('Please enter a valid 10-digit mobile number', 'error');
    }

    if (cart.length === 0) return addToast('Please add medicines to cart', 'error');

    // --- OTP VERIFICATION TEMPORARILY DISABLED AS REQUESTED ---
    /*
    if (!isPhoneVerified) {
      setLoading(true);
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
          });
        }
        
        const appVerifier = window.recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, `+91${phoneTrimmed}`, appVerifier);
        setConfirmationResult(result);
        setShowOtpModal(true);
        addToast('Verification code sent!', 'success');
      } catch (err) {
        console.error('Firebase Auth Error:', err);
        if (window.recaptchaVerifier) {
           window.recaptchaVerifier.clear();
           window.recaptchaVerifier = null;
        }
        addToast('Failed to send verification SMS. Please check your number.', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }
    */

    submitFinalOrder();
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) return addToast('Please enter the 6-digit code', 'error');

    setLoading(true);
    try {
      await confirmationResult.confirm(otpCode);
      setShowOtpModal(false);
      setIsPhoneVerified(true);
      addToast('Phone number verified!', 'success');
      submitFinalOrder(); // Automatically proceed with order
    } catch (err) {
      console.error('OTP Verification Error:', err);
      addToast('Invalid code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitFinalOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          phone,
          address,
          items: cart.map(item => ({
            medicine_id: item.medicine_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('Order placed successfully!', 'success');
        router.push(`/order-confirmation/${data.order_id}`);
      } else {
        addToast(data.error || 'Failed to place order', 'error');
      }
    } catch (err) {
      addToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot"></span>
            Serving Patna Since 1994
          </div>
          <h1>MITHILA MEDICO</h1>
          <p style={{ fontSize: '1.15rem', maxWidth: '550px' }}>
            Trusted Pharmacy in Gardanibagh<br />
            Cash Discount on Medicines • Free Home Delivery Available
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <a href="#order-section" className="btn btn-primary">Order Medicines →</a>
            <a href="/track" className="btn btn-secondary">Track Order</a>
            <a href="tel:8579904555" className="btn btn-secondary" style={{ background: 'rgba(46, 125, 50, 0.15)', borderColor: 'rgba(46, 125, 50, 0.3)', color: '#66BB6A' }}>📞 Call Pharmacy</a>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📍 Gauriya Math, Gandhi Path, Jakkanpur, Gardanibagh, Patna, Bihar 800001</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📞 8579904555</div>
          </div>
        </div>
      </section>

      {/* Why Customers Trust Us */}
      <section className="section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>Why Customers Trust Mithila Medico</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Serving Since 1994</h3>
              <p>Over 30 years of trusted service in the Gardanibagh area of Patna.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💊</div>
              <h3>Genuine Medicines</h3>
              <p>100% authentic medicines sourced from verified distributors.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Cash Discounts</h3>
              <p>Up to 20% cash discount available on medicines.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Quick Packing</h3>
              <p>Orders are packed quickly by our trained staff for fast pickup.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Free Home Delivery</h3>
              <p>Free delivery available within the Gardanibagh area.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Live Order Tracking</h3>
              <p>Track your order status in real-time from your phone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Order Section */}
      <section id="order-section" className="section order-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">Order Medicines from Mithila Medico</h2>
            <p className="section-subtitle">Pickup from Store • Search medicines, add to cart, and checkout in seconds.</p>
          </div>

          <div className="order-layout">
            {/* Left: Medicine Search + Cart */}
            <div>
              <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🔍 Search Medicines</h3>
                <div className="medicine-search-box" ref={searchRef}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type medicine name (e.g. Paracetamol, Vitamin C)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    id="medicine-search"
                  />
                  {showResults && searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(med => {
                        const stock = med.total_stock !== undefined ? med.total_stock : med.stock_quantity;
                        const isLowStock = stock > 0 && stock < (med.low_stock_threshold || 10);
                        return (
                          <div key={med.id} className="search-result-item" onClick={() => (med.total_stock > 0 || med.stock_quantity > 0) && addToCart(med)}>
                            <div>
                              <div className="med-name">{med.name}</div>
                              <div className="med-category" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {med.category}
                                <span style={{ 
                                  fontSize: '0.65rem', 
                                  fontWeight: '600',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '1rem',
                                  background: (med.total_stock <= 0 && med.stock_quantity <= 0) ? 'rgba(239, 68, 68, 0.1)' : (med.total_stock < (med.low_stock_threshold || 10) ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                                  color: (med.total_stock <= 0 && med.stock_quantity <= 0) ? 'var(--accent-red)' : (med.total_stock < (med.low_stock_threshold || 10) ? 'var(--accent-amber)' : 'var(--accent-emerald)'),
                                  textTransform: 'uppercase'
                                }}>
                                  {(med.total_stock <= 0 && med.stock_quantity <= 0) ? 'Out of Stock' : (med.total_stock < (med.low_stock_threshold || 10) ? 'Low Stock' : 'Available')}
                                </span>
                              </div>
                            </div>
                            <div className="med-action">
                              {(med.total_stock > 0 || med.stock_quantity > 0) ? (
                                <span style={{ color: 'var(--primary)', fontWeight: '500', fontSize: '0.9rem' }}>Add +</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Unavailable</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {showResults && searchResults.length === 0 && searchQuery.length >= 1 && (
                    <div className="search-results" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No medicines found
                    </div>
                  )}
                </div>
              </div>

              {/* Cart */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🛒 Your Cart ({cart.length} items)</h3>
                {cart.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem 0' }}>
                    <div className="icon">🛒</div>
                    <p>Search and add medicines above</p>
                  </div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.medicine_id} className="cart-item" style={{ alignItems: 'center' }}>
                        <div className="cart-item-info">
                          <div className="name">{item.name}</div>
                          <div className="meta" style={{ marginTop: '0.25rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Quantity:</span>
                          </div>
                        </div>
                        <div className="cart-item-qty" style={{ marginRight: '1rem' }}>
                          <button onClick={() => updateQuantity(item.medicine_id, -1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.medicine_id, 1)}>+</button>
                        </div>
                        <button className="remove-btn" onClick={() => removeFromCart(item.medicine_id)}>×</button>
                      </div>
                    ))}

                    <div className="cart-summary" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                        Final price will be calculated after packing.
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        You will receive the invoice once your order is ready.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Customer Details */}
            <div>
              <div className="glass-card" style={{ position: 'sticky', top: '5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>👤 Your Details</h3>
                <div className="form-group">
                  <label htmlFor="customer-name">Full Name *</label>
                  <input
                    type="text"
                    id="customer-name"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="customer-phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="customer-phone"
                    className="form-input"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (isPhoneVerified) setIsPhoneVerified(false); // Reset verification if phone changes
                    }}
                    maxLength={10}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="customer-address">Address (Optional — for delivery)</label>
                  <input
                    type="text"
                    id="customer-address"
                    className="form-input"
                    placeholder="Delivery address (optional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div style={{
                  padding: '1rem 1.25rem', background: 'rgba(21, 101, 192, 0.05)',
                  border: '1px solid rgba(21, 101, 192, 0.1)', borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    <li>Our staff will pack your medicines.</li>
                    <li>Final bill will be generated after packing.</li>
                    <li>You will receive a WhatsApp message when your order is ready.</li>
                    <li>Payment will be done at the store during pickup.</li>
                  </ul>
                </div>

                <button
                  className="btn btn-primary btn-full"
                  onClick={placeOrder}
                  disabled={loading || cart.length === 0}
                  id="place-order-btn"
                >
                  {loading ? (
                    <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span> Processing...</>
                  ) : (
                    'Place Order →'
                  )}
                </button>
                <div id="recaptcha-container"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© 2026 Mithila Medico — Serving Patna Since 1994</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>Gauriya Math, Gandhi Path, Gardanibagh, Patna • 📞 8579904555</p>
        </div>
      </footer>

      {showOtpModal && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ maxWidth: '400px', width: '90%', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Verify your number</h3>
              <button
                onClick={() => setShowOtpModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              To prevent fake orders and ensure you receive order status updates inside WhatsApp, we sent a 6-digit code to <strong>+91 {phone}</strong>.
            </p>

            <div className="form-group">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="form-input"
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px' }}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={verifyOtp}
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Place Order'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <HomePage />
    </ToastProvider>
  );
}

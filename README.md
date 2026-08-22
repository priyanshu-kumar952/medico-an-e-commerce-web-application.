<div align="center">

# 💊 Medico — An E-Commerce Web Application

### A full-stack pharmacy management and online ordering platform

Built for **Mithila Medico**, a trusted pharmacy in Gardanibagh, Patna — serving customers since 1994.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📖 About The Project

**Medico** is a production-ready, full-stack e-commerce web application designed specifically for a local pharmacy business. It enables customers to browse medicines, place orders online, and track them in real-time — while giving the pharmacy staff and admin powerful tools to manage inventory, process orders, and monitor business analytics.

### 🎯 Key Highlights

- **Customer-facing storefront** with medicine search, cart, and online ordering
- **Staff dashboard** for order processing, status updates, and daily operations
- **Admin dashboard** with full inventory management, batch tracking, analytics, and business insights
- **Real-time order tracking** for customers via phone number lookup
- **OTP-based phone verification** using Firebase Authentication
- **Role-based access control** with JWT session management

---

## ✨ Features

### 🛒 Customer Portal
- 🔍 Real-time medicine search with stock availability indicators
- 🛒 Shopping cart with quantity controls and stock validation
- 📦 Online order placement with customer details
- 📱 OTP verification via Firebase (SMS-based)
- 📍 Real-time order tracking by phone number
- 📄 Order history lookup
- 🧾 Order confirmation page with bill details

### 👨‍💼 Staff Dashboard
- 📋 View and manage incoming orders
- ✅ Update order status (In Progress → Packed → Delivered)
- 🔐 Secure login with staff credentials
- 📊 Daily order summary

### 🛠️ Admin Dashboard
- 📊 Business analytics with revenue charts (powered by Recharts)
- 💊 Full medicine catalog management (CRUD)
- 📦 Batch-level inventory tracking (batch no, MFD, expiry, stock)
- 📈 Inventory logs and stock movement history
- ⚠️ Expiry alerts for medicines nearing expiration
- 🧾 Bill management and order logs
- 👥 Staff account management
- 📉 Daily sales reports and medicine-level statistics
- 🔒 Rate-limited API endpoints for security

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Next.js 16 (App Router) |
| **Styling** | Vanilla CSS with CSS Variables (dark theme, glassmorphism) |
| **Backend** | Next.js API Routes (Route Handlers) |
| **Database** | SQLite via `better-sqlite3` (WAL mode) |
| **Authentication** | JWT (`jose`) + Firebase Phone Auth |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Security** | bcryptjs (password hashing), rate limiting, input validation |

---

## 📁 Project Structure

```
medico/
├── app/
│   ├── page.js                    # Customer homepage (search, cart, order)
│   ├── layout.js                  # Root layout with metadata
│   ├── globals.css                # Global styles & design system
│   ├── about/                     # About page
│   ├── track/                     # Order tracking page
│   ├── history/                   # Order history lookup
│   ├── order-confirmation/        # Post-order confirmation page
│   ├── staff/
│   │   ├── login/                 # Staff login page
│   │   ├── dashboard/             # Staff order management dashboard
│   │   └── orders/                # Staff order detail views
│   ├── admin/
│   │   └── dashboard/             # Admin dashboard (inventory, analytics, management)
│   └── api/
│       ├── auth/                  # Authentication endpoints
│       ├── medicines/             # Medicine CRUD + search
│       ├── orders/                # Order management endpoints
│       ├── batches/               # Batch-level inventory management
│       ├── inventory/             # Inventory logs
│       ├── stats/                 # Analytics & reporting endpoints
│       └── otp/                   # OTP verification
├── components/
│   ├── Navbar.js                  # Navigation bar
│   ├── Toast.js                   # Toast notification system
│   ├── DateRangeCalendar.js       # Date range picker for reports
│   └── ExpiryAlerts.js            # Medicine expiry alert component
├── lib/
│   ├── db.js                      # Database initialization & helpers
│   ├── auth.js                    # JWT token signing & verification
│   ├── firebase.js                # Firebase client initialization
│   ├── seed.js                    # Database seeding with sample data
│   └── rate-limit.js              # API rate limiting utility
├── public/
│   └── uploads/                   # Uploaded prescription images
├── medico.db                      # SQLite database file
├── package.json
└── next.config.mjs
```

---

## 🗄️ Database Schema

The application uses **SQLite** with the following tables:

| Table | Purpose |
|---|---|
| `medicines` | Medicine catalog (name, category, MRP, discount, stock) |
| `batches` | Batch-level tracking (batch no, MFD, expiry, stock per batch) |
| `staff` | Staff accounts with hashed passwords |
| `orders` | Customer orders with status tracking |
| `order_items` | Line items for each order |
| `bills` | Generated bills with subtotal, discount, and final amount |
| `order_logs` | Audit trail for order status changes |
| `inventory_logs` | Stock movement history |
| `otps` | Temporary OTP storage for phone verification |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/priyanshu-kumar952/medico-an-e-commerce-web-application.git
   cd medico-an-e-commerce-web-application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # JWT Secret (used for staff/admin session tokens)
   JWT_SECRET=your_jwt_secret_key_here

   # Firebase Configuration (for OTP phone verification)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in your browser**
   ```
   http://localhost:3000
   ```

> **Note:** The SQLite database (`medico.db`) is auto-created and seeded with sample data on first run.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/medicines?q=` | Search medicines by name |
| `GET` | `/api/medicines/[id]` | Get medicine details |
| `POST` | `/api/orders` | Place a new order |
| `GET` | `/api/orders/[id]` | Get order details |
| `POST` | `/api/auth` | Staff/Admin login |
| `GET` | `/api/batches` | List medicine batches |
| `GET` | `/api/batches/[id]` | Get batch details |
| `GET` | `/api/inventory/logs` | View inventory movement logs |
| `GET` | `/api/stats` | Dashboard analytics data |
| `GET` | `/api/stats/daily-sales` | Daily sales reports |
| `GET` | `/api/stats/medicines` | Medicine-level statistics |
| `POST` | `/api/otp` | Send/verify OTP |

---

## 🖥️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `localhost:3000` |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Priyanshu Kumar**

- GitHub: [@priyanshu-kumar952](https://github.com/priyanshu-kumar952)

---

<div align="center">

**⭐ If you found this project useful, please consider giving it a star!**

</div>

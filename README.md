<div align="center">

# 💊 Medico — An E-Commerce Web Application

### A production-grade, full-stack pharmacy management and online medicine ordering platform

Built for **Mithila Medico** — a real, trusted pharmacy in Gardanibagh, Patna, serving customers since 1994.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📖 The Story Behind This Project

Mithila Medico is a real pharmacy in Gardanibagh, Patna that has been running since 1994. In real life, it operates entirely offline — customers either walk in or place orders over WhatsApp.

I'm a **1st-year B.Tech CSE student**, and I decided to build something real. I looked at this pharmacy and thought: *"What if I could digitize the entire operation — the ordering, the inventory, the billing, the tracking — everything?"*

**I designed and architected every single aspect of this application myself** — the feature set, the database schema, the user flows, the role-based access system, the order lifecycle, the billing logic, the analytics dashboards, the UI/UX — all of it came from my own understanding and vision. While I used AI as a coding and debugging assistant, every architectural decision, every feature, and every design choice is mine.

This is not a tutorial project or a clone. This is a **complete, production-ready pharmacy management system** built to solve real business problems.

---

## 🎯 What This Application Does

Medico is a **3-panel web application** that serves three different types of users, each with their own interface and capabilities:

| Panel | Who Uses It | What They Can Do |
|---|---|---|
| **🛒 Customer Portal** | Customers (general public) | Search medicines, build cart, place orders, track orders, view history, download invoices |
| **👨‍💼 Staff Dashboard** | Pharmacy staff members | Process orders, manage inventory, view medicine insights, track order logs |
| **👑 Admin (Owner) Dashboard** | Pharmacy owner | Everything staff can do + revenue analytics, sales charts, daily reports, full CRUD on inventory, order audit logs, inventory audit logs |

---

## ✨ Features — In Detail

### 🛒 Customer Portal (Public-facing)

#### 1. Real-Time Medicine Search
Customers can search for any medicine by name. The search is **debounced** (250ms delay) to avoid flooding the server. As they type, matching medicines appear in a dropdown with:
- Medicine name and category
- **Stock availability badge** — shows `Available`, `Low Stock`, or `Out of Stock` with color-coded indicators (green/amber/red)
- Out-of-stock medicines are grayed out and unclickable

#### 2. Shopping Cart System
A fully functional cart with:
- **Add to cart** directly from search results (single click)
- **Quantity controls** — increment/decrement buttons with stock validation (you cannot add more than what's available)
- **Remove items** from cart
- **Stock-aware validation** — if a medicine has only 5 units, you cannot add 6 to the cart
- Items show medicine name, category, and current quantity

#### 3. Order Placement
Customers fill in their details and place an order:
- **Full Name** (required)
- **Phone Number** (required, validated with regex — must be a valid 10-digit Indian mobile number starting with 6-9, rejects repeated digits like `1111111111` and sequential patterns)
- **Delivery Address** (optional — for future home delivery support)
- Server-side stock re-validation at the time of order creation (prevents race conditions)
- **Atomic order creation** using SQLite transactions — if any item fails stock check, the entire order is rolled back

#### 4. OTP Phone Verification (Firebase)
The system has a built-in **Firebase Phone Authentication** flow:
- When a customer places an order, an invisible reCAPTCHA is triggered
- A 6-digit OTP is sent to their phone via SMS
- They must verify the OTP before the order goes through
- This prevents fake/spam orders
- *Currently disabled for testing purposes, but the full implementation is in the codebase and can be enabled with one toggle*

#### 5. Order Confirmation Page
After placing an order, customers are redirected to a dedicated confirmation page showing:
- Unique Order ID (format: `MED-XXXXXX-XXX`)
- Order status
- Items ordered
- A message explaining that final billing happens after packing

#### 6. Real-Time Order Tracking
Customers can track their orders at `/track` by entering their **phone number** or **Order ID**:
- Shows all **active orders** (excludes completed and cancelled)
- Displays a **visual timeline** with 3 stages: `Order Received → Order Packed → Order Collected`
- Each stage lights up green with a checkmark as the order progresses
- Shows order details: customer name, phone, items, quantities
- For packed/completed orders, shows the **final payable amount**
- **Contextual messages**: 
  - "Final bill will be generated once packing is complete" (for placed orders)
  - "Your order is ready! Please collect from: [store address]" (for packed orders)

#### 7. Customer-Side Order Cancellation
Customers can cancel their own orders directly from the tracking page:
- Available for orders in `PLACED` or `PACKED` status
- Confirmation dialog before cancellation
- Cancellation is logged with `cancelled_by: customer` for audit purposes
- Cancelled orders immediately disappear from the active tracking view

#### 8. Invoice Download & Print
For packed or completed orders, customers can:
- **Download a professionally formatted invoice** that opens in a new tab
- Invoice includes: pharmacy branding, bill number, order details, itemized list with MRP/discount/line totals, subtotal, discount amount, final payable amount
- **Print/Save as PDF** button built into the invoice page
- Styled with professional typography, blue accent theme, and clean table layout

#### 9. Purchase History
At `/history`, customers can look up all their past orders by phone number:
- Shows **all non-cancelled orders** (including completed ones)
- Displays order ID, bill number, date, items, and amount paid
- Download invoice button for each completed order
- Separate from the tracking page (tracking shows only active; history shows all)

#### 10. About Page
A dedicated `/about` page with:
- Pharmacy information (address, contact, store type, discounts)
- "Why Choose Us" feature list
- **Embedded Google Maps** showing the pharmacy location
- CTA buttons to order medicines or call the pharmacy

---

### 👨‍💼 Staff Dashboard (`/staff/dashboard`)

Staff members log in with their **staff ID and password** at `/staff/login`. The system uses **bcrypt** for password hashing and **JWT (JSON Web Tokens)** for session management stored in HTTP-only cookies.

#### 1. Order Management
- View all incoming orders as cards showing: Order ID, customer name, phone, bill number, timestamp, status badge, and final amount
- **Status badges** are color-coded: Blue (Placed), Amber (Packed), Green (Completed), Red (Cancelled)
- Click any order card to navigate to its **detailed management page** at `/staff/orders/[orderId]`

#### 2. Order Status Pipeline
Dashboard shows **4 KPI cards** at the top:
- **Placed** — orders awaiting packing
- **Packed** — orders ready for customer pickup
- **Completed** — orders that have been collected
- **Cancelled** — orders that were cancelled

#### 3. Live Search with Debounce
Staff can search orders by:
- Order ID
- Customer name
- Phone number
- Bill number
- Search is debounced (500ms) so it doesn't fire on every keystroke

#### 4. Advanced Filtering & Sorting
- **Quick filters**: All Orders, Placed, Packed, Completed, Cancelled
- **Date filters**: Today, Last 7 Days
- **Sort**: Newest first / Oldest first
- **Custom Timeframe Picker**: A full-featured popover with:
  - Preset buttons: Today, Yesterday, This Week, This Month, All Time
  - **Custom Date Range Calendar** — a dual-calendar component where you can select any start and end date

#### 5. Inventory Management
Staff can manage the pharmacy's medicine inventory:
- **Search medicines** by name with a search bar
- **Filter by category** using a dropdown
- **Expandable medicine rows** — click a medicine to see all its batches
- Each batch shows: Batch No, Stock Quantity, MFD Date, Expiry Date, MRP, Discount %
- **Add New Medicine** — modal form with: name, category, batch no, MRP, discount %, initial quantity, low stock threshold, MFD date, expiry date
- **Add New Batch** to existing medicine — for when a new shipment arrives with a different batch number
- **Edit Batch Details** — modify batch no, MRP, discount, stock, MFD, expiry (with smart locking — if a batch has been used in orders, its batch number cannot be changed)
- **Stock Adjustment** — add or remove stock with a reason/note (e.g., "Broken stock", "Return from customer")
- **Delete Batch** — permanent deletion with confirmation dialog
- **Delete Medicine** — cascading delete that removes the medicine AND all its batches and history (admin only)
- **Low stock indicators** — medicines with stock below their threshold appear in red

#### 6. Medicine Insights
A dedicated tab showing the **Top 20 Most Sold Medicines**:
- Ranked table with medal icons for top 3 (🥇🥈🥉)
- Shows quantity sold and revenue generated per medicine
- Respects the selected timeframe filter

#### 7. Order Logs (Audit Trail)
Chronological log of all order-related activities:
- Shows: Order ID, action taken, who performed it, timestamp
- Filterable by action type: Placed, Packed, Completed, Cancelled
- Actions that include "cancelled" are displayed in red for quick identification

#### 8. Expiry Alerts System
A dedicated alert panel (modal) that scans the entire inventory and groups medicines into:
- **🔴 Expired** — medicines past their expiry date
- **🟠 Critical** — expiring within 30 days
- **🟢 Warning** — expiring within 30-60 days
- Each group shows: medicine name, quantity in stock, expiry date, and days remaining
- Sorted by urgency (closest expiry first)

---

### 👑 Admin / Owner Dashboard (`/admin/dashboard`)

The admin dashboard includes **everything the staff dashboard has**, plus several additional powerful features:

#### 1. Sales Analytics Tab
A dedicated analytics section with:
- **4 KPI Cards**: Total Revenue, Total Completed Orders, Average Order Value (AOV), Total Units Sold — all scoped to the selected timeframe
- **Sales Performance Trend Chart** — an interactive line chart (built with Recharts) showing daily revenue over time, with hover tooltips showing exact revenue per day
- **Top 5 Selling Medicines Table** — quick revenue breakdown
- **Order Status Pipeline** — horizontal bar chart showing the distribution of orders across statuses (Placed → Packed → Completed → Cancelled)
- **Daily Performance Breakdown Table** — day-by-day breakdown of orders, units sold, and revenue with a "Show More Records" button for pagination

#### 2. Revenue KPIs
The admin can see revenue metrics scoped to any timeframe:
- Today's revenue
- This week's revenue
- This month's revenue
- All-time revenue
- Custom date range revenue

#### 3. Full Inventory CRUD (Create, Read, Update, Delete)
Admin has unrestricted access to:
- Add new medicines with initial batch
- Add new batches to existing medicines
- Edit any batch details (batch no, MRP, discount, stock, dates)
- Delete individual batches
- Delete entire medicines (cascading delete)
- **Operation mode selector**: Edit Details (correct mistakes) / Add Stock (+) / Remove Stock (-)

#### 4. Inventory Audit Logs
A separate tab showing the **last 100 inventory changes**:
- Timestamp of change
- Medicine name and batch number
- Action type: `ADD_STOCK`, `REMOVE_STOCK`, etc. (color-coded badges)
- Quantity changed (green for additions, red for removals)
- Reason or who performed the action

#### 5. Order Logs with Advanced Filtering
Complete audit trail of every order action:
- Filterable by status type
- Shows who performed each action (system, staff name, or customer)
- For cancellations, shows whether it was cancelled by staff or customer
- Respects the global timeframe filter

#### 6. Paginated Order View
Admin orders view supports **server-side pagination**:
- Configurable page size
- Page navigation (Prev/Next)
- Shows "Page X of Y" indicator
- Total order count

---

### 🔧 Backend & Infrastructure Features

These are features that aren't visible on the UI but make the application robust:

#### 1. Atomic Transactions
Order creation is wrapped in a **SQLite transaction**. If any item fails stock validation mid-order, the entire order is rolled back — no partial orders.

#### 2. Rate Limiting
The order placement API is rate-limited to **5 requests per minute per IP address**. This prevents abuse and spam. Implemented with an in-memory sliding window algorithm.

#### 3. Server-Side Input Validation
- Phone numbers are validated with regex (`/^[6-9]\d{9}$/`) and reject patterns like repeated digits (`1111111111`) and sequential numbers
- Stock availability is **double-checked on the server** — even if the frontend shows stock available, the backend re-validates before creating the order
- All required fields are validated server-side

#### 4. Role-Based Access Control
- **Staff** — can view orders, manage inventory, view insights
- **Admin** — everything staff can do + analytics, revenue data, full inventory CRUD, audit logs, delete medicines
- Access control is enforced both on the frontend (redirects) and backend (JWT session verification)

#### 5. JWT Session Management
- Staff/Admin sessions use **JWT tokens** signed with HS256
- Tokens expire after 24 hours
- Stored in HTTP-only cookies via `jose` library
- Session verification on protected API routes

#### 6. Password Security
Staff passwords are hashed using **bcryptjs** before storing in the database. Plain-text passwords are never stored.

#### 7. Database Architecture
- **9 tables** with proper foreign key constraints and indexes
- **WAL (Write-Ahead Logging) mode** for better concurrent read performance
- **Auto-migration** — the database schema auto-creates and auto-migrates on first run
- **Auto-seeding** — sample data is automatically inserted if the database is empty
- **Indexed columns** for fast queries on frequently searched fields (medicine name, category, order phone, order ID, etc.)

#### 8. Smart Billing System
- Bills are generated **only during packing**, not during order placement
- Bill numbers are auto-generated with format: `BILL-YYYYMMDD-XXXX` (sequential per day)
- Order IDs use a combination of timestamp + random characters: `MED-XXXXXX-XXX`
- Line totals are calculated based on the specific batch used during packing (MRP × quantity - discount)

#### 9. Batch-Level Inventory
Instead of just tracking "total stock", the system tracks inventory at the **batch level**:
- Each medicine can have multiple batches
- Each batch has its own: batch number, MRP, discount %, stock count, manufacturing date, expiry date
- Stock deductions during packing happen at the batch level
- This mirrors how real pharmacies manage inventory

---

## 🛠️ Tech Stack

| Layer | Technology | Why I Chose It |
|---|---|---|
| **Frontend** | React 19, Next.js 16 (App Router) | Latest React with server components, file-based routing, and built-in API routes |
| **Styling** | Vanilla CSS with CSS Variables | Dark theme with glassmorphism, fully custom design system without any CSS framework |
| **Backend** | Next.js API Routes (Route Handlers) | Full-stack in one project — no separate backend server needed |
| **Database** | SQLite via `better-sqlite3` | Zero-config embedded database, perfect for a single-server app, no external DB setup |
| **Auth** | JWT (`jose`) + Firebase Phone Auth | JWT for staff sessions, Firebase for customer OTP verification |
| **Charts** | Recharts | React-native charting library for the sales analytics dashboard |
| **Icons** | Lucide React | Clean, modern icon set |
| **Security** | bcryptjs, rate-limiter, input validation | Industry-standard password hashing and API protection |

---

## 📁 Project Structure

```
medico/
├── app/
│   ├── page.js                        # Customer homepage — search, cart, order placement
│   ├── layout.js                      # Root layout with SEO metadata
│   ├── globals.css                    # Full design system (26KB of custom CSS)
│   ├── about/page.js                  # About the pharmacy — info, map, contact
│   ├── track/page.js                  # Order tracking — timeline, invoice download, cancel
│   ├── history/page.js                # Purchase history — past orders lookup
│   ├── order-confirmation/            # Post-order confirmation page
│   ├── staff/
│   │   ├── login/page.js              # Staff login (bcrypt + JWT)
│   │   ├── dashboard/page.js          # Staff dashboard (1014 lines)
│   │   └── orders/[orderId]/page.js   # Individual order management
│   ├── admin/
│   │   └── dashboard/page.js          # Admin dashboard (1474 lines — the biggest file)
│   └── api/
│       ├── auth/route.js              # Login/logout endpoints
│       ├── medicines/
│       │   ├── route.js               # Medicine search + CRUD
│       │   ├── [id]/route.js          # Single medicine operations
│       │   └── inventory/route.js     # Inventory listing with batch details
│       ├── orders/
│       │   ├── route.js               # Create order (POST) + List orders (GET)
│       │   └── [id]/route.js          # Get/Update/Cancel individual order
│       ├── batches/
│       │   ├── route.js               # Create batch
│       │   └── [id]/route.js          # Edit/Delete batch
│       ├── inventory/logs/route.js    # Inventory audit logs
│       ├── stats/
│       │   ├── route.js               # Dashboard KPI stats
│       │   ├── daily-sales/route.js   # Day-by-day sales data
│       │   └── medicines/route.js     # Top selling medicines data
│       └── otp/route.js               # OTP send/verify
├── components/
│   ├── Navbar.js                      # Responsive navigation bar
│   ├── Toast.js                       # Toast notification system (success/error/info)
│   ├── DateRangeCalendar.js           # Custom dual-calendar date range picker
│   └── ExpiryAlerts.js                # Medicine expiry scanner & alert modal
├── lib/
│   ├── db.js                          # Database init, schema, migrations, helpers
│   ├── auth.js                        # JWT sign/verify/session management
│   ├── firebase.js                    # Firebase client configuration
│   ├── seed.js                        # Auto-seed sample medicines & staff
│   └── rate-limit.js                  # Sliding-window rate limiter
├── public/uploads/                    # Prescription image uploads
├── medico.db                          # SQLite database (auto-created)
├── package.json
└── next.config.mjs
```

---

## 🗄️ Database Schema

The application uses **SQLite** with **9 interconnected tables**:

| Table | Purpose | Key Fields |
|---|---|---|
| `medicines` | Medicine catalog | name, category, MRP, discount, stock, low_stock_threshold, is_active |
| `batches` | Batch-level inventory | medicine_id (FK), batch_no, MRP, discount, stock, MFD, expiry, is_active |
| `staff` | Staff/Admin accounts | staff_id, name, password_hash, role |
| `orders` | Customer orders | order_id, customer_name, phone, address, status, cancelled_by, staff_id |
| `order_items` | Line items per order | order_id (FK), medicine_id (FK), batch_id (FK), quantity, MRP, discount, line_total |
| `bills` | Generated invoices | bill_number, order_id (FK), subtotal, total_discount, final_amount |
| `order_logs` | Order audit trail | order_id (FK), action, performed_by, timestamp |
| `inventory_logs` | Stock change history | batch_id (FK), change_type, quantity_added, reason |
| `otps` | Temporary OTP codes | phone, otp_code, expires_at |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/priyanshu-kumar952/medico-an-e-commerce-web-application.git
cd medico-an-e-commerce-web-application

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env.local file in the root:
```

```env
# JWT Secret (for staff/admin session tokens)
JWT_SECRET=your_jwt_secret_key_here

# Firebase Config (for OTP verification)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

```bash
# 4. Run the development server
npm run dev

# 5. Open in browser
# → http://localhost:3000
```

> **Note:** The SQLite database is auto-created and seeded with sample data on first run. No database setup needed.

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/medicines?q=` | Search medicines by name | No |
| `POST` | `/api/medicines` | Add new medicine | Yes (Staff/Admin) |
| `GET` | `/api/medicines/[id]` | Get medicine details | No |
| `DELETE` | `/api/medicines/[id]` | Delete medicine + batches | Yes (Admin) |
| `GET` | `/api/medicines/inventory` | List all inventory with batches | Yes (Staff/Admin) |
| `POST` | `/api/orders` | Place a new order | No (Rate limited) |
| `GET` | `/api/orders` | List orders (with filters) | Yes |
| `GET` | `/api/orders/[id]` | Get order details + items + logs | No |
| `PATCH` | `/api/orders/[id]` | Update order status / cancel | Yes (Staff/Admin) |
| `POST` | `/api/auth` | Staff/Admin login | No |
| `POST` | `/api/batches` | Add new batch to medicine | Yes (Staff/Admin) |
| `PUT` | `/api/batches/[id]` | Edit batch / adjust stock | Yes (Staff/Admin) |
| `DELETE` | `/api/batches/[id]` | Permanently delete batch | Yes (Admin) |
| `GET` | `/api/inventory/logs` | View inventory audit logs | Yes (Staff/Admin) |
| `GET` | `/api/stats` | Dashboard KPI statistics | Yes (Staff/Admin) |
| `GET` | `/api/stats/daily-sales` | Daily sales breakdown | Yes (Admin) |
| `GET` | `/api/stats/medicines` | Top selling medicines data | Yes (Staff/Admin) |
| `POST` | `/api/otp` | Send/verify OTP | No |

---

## 🖥️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `localhost:3000` |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |

---

## 📊 Project Complexity at a Glance

| Metric | Count |
|---|---|
| **Total Pages** | 8 (Customer: 5, Staff: 3, Admin: 1) |
| **API Endpoints** | 18+ route handlers |
| **Database Tables** | 9 |
| **Reusable Components** | 4 (Navbar, Toast, DateRangeCalendar, ExpiryAlerts) |
| **Admin Dashboard Code** | 1,474 lines |
| **Staff Dashboard Code** | 1,014 lines |
| **Custom CSS** | 26 KB (full design system) |
| **Total Dependencies** | 9 production + 2 dev |

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
- 1st Year B.Tech CST Student at sage university indore.
- GitHub: [@priyanshu-kumar952](https://github.com/priyanshu-kumar952)

---

<div align="center">

*Designed, architected, and built from scratch as a real-world solution for a real business.*

**⭐ If you found this project impressive, consider giving it a star!**

</div>

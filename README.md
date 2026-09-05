<div align="center">

# 💊 Medico

### A full-stack pharmacy e-commerce & management platform built for a real-world pharmacy

**Medico digitizes medicine ordering, inventory management, billing, order tracking, staff operations, and business analytics in one application.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions)](https://github.com/features/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📌 Overview

**Medico** is a production-deployed, full-stack pharmacy platform designed around the workflow of a real local pharmacy.

It provides three role-specific experiences:

| Experience | Purpose |
|---|---|
| 🛒 **Customer Portal** | Search medicines, manage a cart, place orders, track orders, view purchase history, and access invoices |
| 👨‍💼 **Staff Dashboard** | Process orders, manage stock and batches, monitor medicine insights, and review operational logs |
| 👑 **Admin Dashboard** | Manage the complete pharmacy operation with sales analytics, inventory control, audit logs, and business KPIs |

The application is intentionally built as a **single Next.js application** containing the frontend and backend API, backed by SQLite for persistent single-server operation.

---

## 🏪 Why I Built This

Medico was built for **Mithila Medico**, a real pharmacy in Gardanibagh, Patna, serving customers since 1994.

The pharmacy traditionally operated offline, with customers visiting the store or placing orders through WhatsApp. I wanted to turn that real-world workflow into a proper software system rather than building another generic tutorial project.

I am **Priyanshu Kumar, a B.Tech Computer Science & Technology student**, and I designed the product around the actual operational problems a pharmacy needs to solve:

- How customers discover available medicines
- How orders are received and processed
- How stock is tracked across individual batches
- How staff manage incoming inventory
- How billing is generated
- How customers track their orders
- How the owner understands sales performance
- How operational changes are audited

I used AI tools as development and debugging assistants, but the **product concept, architecture, feature set, database design, workflows, UI decisions, security model, and deployment approach were designed and directed by me**.

---

# ✨ Core Features

## 🛒 Customer Experience

### Medicine Search
- Debounced medicine search
- Search by medicine name
- Category information
- Live stock status:
  - 🟢 Available
  - 🟠 Low Stock
  - 🔴 Out of Stock
- Out-of-stock medicines cannot be added to the cart

### Shopping Cart
- Add medicines directly from search
- Increase/decrease quantities
- Remove items
- Stock-aware quantity validation
- Prevents ordering beyond available inventory

### Order Placement
- Customer name
- Indian mobile number validation
- Optional delivery address
- Server-side stock validation
- Atomic order creation using SQLite transactions
- Unique order IDs

### 📱 Phone Verification
Firebase Phone Authentication is integrated for OTP-based customer verification.

The flow supports:
- Invisible reCAPTCHA
- SMS OTP
- 6-digit verification
- Protection against fake/spam orders

> OTP verification is currently disabled for testing, but the implementation remains available in the codebase.

### 📦 Order Tracking
Customers can track orders using their phone number or Order ID.

The tracking workflow is:

```text
Order Received → Order Packed → Order Collected
```

Customers can see:
- Order status
- Ordered medicines
- Quantities
- Customer information
- Final payable amount after packing
- Contextual status messages
- Cancellation option for eligible orders

### 🧾 Invoices
Packed/completed orders can generate professional invoices containing:
- Pharmacy information
- Bill number
- Order details
- Itemized medicines
- MRP
- Discounts
- Subtotal
- Final payable amount
- Print / Save as PDF support

### 🕘 Purchase History
Customers can retrieve previous non-cancelled orders using their phone number.

### 📍 Pharmacy Information
The About page provides:
- Pharmacy information
- Contact details
- Store information
- Embedded Google Maps
- Ordering and contact CTAs

---

# 👨‍💼 Staff Dashboard

The staff interface is designed around day-to-day pharmacy operations.

## Order Management
- View incoming orders
- Search by:
  - Order ID
  - Customer name
  - Phone number
  - Bill number
- Debounced search
- Status-based filtering
- Date filtering
- Newest/oldest sorting
- Custom date ranges

## Order Workflow

```text
PLACED
   ↓
PACKED
   ↓
COMPLETED

       ↘ CANCELLED
```

Status is reflected throughout the staff and customer interfaces.

## 📦 Inventory Management

Inventory is tracked at the **batch level**, rather than as a single stock number.

Staff can:
- Search medicines
- Filter by category
- Expand medicines to view batches
- Add medicines
- Add new batches
- Edit batch information
- Adjust stock
- Record adjustment reasons
- Delete batches where permitted
- Monitor low-stock medicines

Each batch can contain:

```text
Batch Number
Stock Quantity
MRP
Discount %
Manufacturing Date
Expiry Date
```

## 💊 Medicine Insights
- Top 20 most-sold medicines
- Quantity sold
- Revenue generated
- Timeframe-aware reporting

## 📋 Order Audit Logs
The system records order activity including:
- Order ID
- Action
- Performer
- Timestamp

Supported activities include:
- Placed
- Packed
- Completed
- Cancelled

## ⏰ Expiry Alerts

Inventory is automatically categorized by expiry urgency:

| Level | Condition |
|---|---|
| 🔴 **Expired** | Past expiry date |
| 🟠 **Critical** | Expires within 30 days |
| 🟢 **Warning** | Expires within 30–60 days |

---

# 👑 Admin / Owner Dashboard

The admin dashboard extends the staff workflow with business-level visibility and control.

## 📊 Sales Analytics

Timeframe-aware KPIs include:

- Total Revenue
- Completed Orders
- Average Order Value
- Total Units Sold

Additional analytics include:
- Daily revenue trend
- Top-selling medicines
- Order status distribution
- Daily performance breakdown
- Orders and units sold by day
- Custom date-range analysis

Charts are implemented using **Recharts**.

## 💰 Revenue Reporting

Revenue can be viewed for:

- Today
- This week
- This month
- All time
- Custom date range

## 🛠️ Full Inventory Control

Administrators can:
- Create medicines
- Create batches
- Edit batch details
- Add stock
- Remove stock
- Delete batches
- Delete medicines
- Review stock changes

## 🧾 Inventory Audit Trail

Inventory changes record:
- Timestamp
- Medicine
- Batch
- Action type
- Quantity changed
- Reason / performer

This creates an operational history instead of silently changing stock values.

## 📑 Advanced Order Administration
- Server-side pagination
- Configurable page size
- Page navigation
- Total order count
- Advanced filtering
- Complete order audit trail
- Identification of customer/staff/system actions

---

# 🔐 Security & Backend Design

Medico is not just a frontend application. Important business rules are enforced on the server.

### Atomic Transactions

Order creation uses SQLite transactions.

If stock validation fails for any item, the complete transaction is rolled back rather than creating a partial order.

### Server-Side Validation

The backend validates:
- Required fields
- Indian mobile numbers
- Stock availability
- Order quantities
- Protected operations

Frontend validation is therefore not treated as a security boundary.

### Rate Limiting

The order-placement endpoint uses an in-memory sliding-window rate limiter to reduce spam and abuse.

### Role-Based Access Control

```text
                 ┌───────────────┐
                 │     Admin     │
                 └───────┬───────┘
                         │
                  Everything Staff
                         │
                 ┌───────▼───────┐
                 │     Staff     │
                 └───────┬───────┘
                         │
                   Operational
                    Management
```

Authorization is enforced on protected backend routes using authenticated sessions and role checks.

### Authentication

Staff/Admin authentication uses:

- bcrypt password hashing
- JWT sessions
- HS256 signing
- 24-hour token expiration
- HTTP-only cookies
- `jose` for JWT handling

### Database Integrity

SQLite is configured with:
- Foreign-key enforcement
- WAL (Write-Ahead Logging)
- Indexed frequently queried fields
- Automatic schema initialization
- Automatic migrations
- Automatic seed data for an empty database

---

# 🗄️ Database

Medico uses **SQLite with `better-sqlite3`**.

The current schema contains 9 interconnected tables:

| Table | Purpose |
|---|---|
| `medicines` | Medicine catalog |
| `batches` | Batch-level inventory |
| `staff` | Staff/Admin accounts |
| `orders` | Customer orders |
| `order_items` | Medicines belonging to orders |
| `bills` | Generated invoices |
| `order_logs` | Order audit history |
| `inventory_logs` | Inventory change history |
| `otps` | Temporary OTP records |

### Why Batch-Level Inventory?

A pharmacy cannot safely treat every unit of a medicine as identical.

Different batches can have different:

- Batch numbers
- MRPs
- Discounts
- Manufacturing dates
- Expiry dates
- Quantities

Medico therefore models inventory at the batch level and performs stock deductions accordingly.

---

# 💳 Billing

Bills are generated during the **packing stage**, rather than when the customer initially places an order.

Bill numbers follow:

```text
BILL-YYYYMMDD-XXXX
```

Order IDs follow:

```text
MED-XXXXXX-XXX
```

Line totals are calculated from the batch used during packing:

```text
MRP × Quantity − Discount
```

This keeps the final bill tied to the actual inventory batch used to fulfill the order.

---

# 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Framework | Next.js 16 App Router |
| Backend | Next.js Route Handlers |
| Language | JavaScript |
| Styling | Custom CSS + CSS Variables |
| Database | SQLite + better-sqlite3 |
| Authentication | JWT + bcryptjs |
| Customer OTP | Firebase Phone Authentication |
| Charts | Recharts |
| Icons | Lucide React |
| Containerization | Docker |
| Registry | GitHub Container Registry |
| Cloud | AWS EC2 |
| Reverse Proxy | Caddy |
| Server Management | AWS Systems Manager |
| CI/CD | GitHub Actions |
| Cloud Authentication | GitHub OIDC → AWS IAM |

---

# 🚀 Deployment Architecture

The application is deployed on an **AWS EC2 instance** and runs as a Docker container.

```text
                         Internet
                            │
                       HTTP :80
                            │
                         Caddy
                            │
                    Reverse Proxy
                            │
                    ┌───────▼───────┐
                    │    Docker     │
                    │    Medico     │
                    │   Next.js     │
                    └───────┬───────┘
                            │
                     /app/data
                            │
                  Persistent Docker Volume
                            │
                         SQLite
```

The application is currently designed for a **single-server deployment**, which fits the current SQLite architecture.

## Infrastructure

- AWS EC2
- Ubuntu Linux
- Docker
- Persistent Docker volume for SQLite
- Caddy reverse proxy
- AWS Systems Manager (SSM)
- GitHub Container Registry

The database is stored outside the application container through a persistent Docker volume, so replacing the application container does not remove the database.

---

# 🔄 CI/CD Pipeline

Every push to `main` automatically goes through the deployment pipeline:

```text
Developer
   │
   │ git push
   ▼
GitHub
   │
   ▼
GitHub Actions
   │
   ├── Install dependencies
   ├── Lint
   ├── Build Next.js
   │
   ├── Build Docker image
   └── Push image to GHCR
             │
             ▼
        GitHub OIDC
             │
             ▼
          AWS IAM
             │
             ▼
       AWS Systems Manager
             │
             ▼
           EC2
             │
             ├── Pull latest image
             ├── Replace container
             ├── Preserve database volume
             └── Run health check
             │
             ▼
          🚀 Live
```

### Why OIDC?

GitHub Actions does **not** require a long-lived AWS access key stored as a GitHub secret.

Instead:

```text
GitHub Actions
      ↓
OIDC Identity Token
      ↓
AWS IAM Role
      ↓
Temporary AWS Credentials
```

This provides a cleaner and safer deployment authentication model.

### Deployment Health Check

After deployment, the pipeline verifies:

```text
GET /api/health
```

A successful response confirms that the new application container is running correctly.

---

# 🏗️ Project Structure

```text
medico/
├── app/
│   ├── page.js
│   ├── layout.js
│   ├── globals.css
│   │
│   ├── about/
│   ├── track/
│   ├── history/
│   ├── order-confirmation/
│   │
│   ├── staff/
│   │   ├── login/
│   │   ├── dashboard/
│   │   └── orders/[orderId]/
│   │
│   ├── admin/
│   │   └── dashboard/
│   │
│   └── api/
│       ├── auth/
│       ├── medicines/
│       ├── orders/
│       ├── batches/
│       ├── inventory/
│       ├── stats/
│       └── otp/
│
├── components/
│   ├── Navbar.js
│   ├── Toast.js
│   ├── DateRangeCalendar.js
│   └── ExpiryAlerts.js
│
├── lib/
│   ├── db.js
│   ├── auth.js
│   ├── firebase.js
│   ├── seed.js
│   └── rate-limit.js
│
├── public/
├── Dockerfile
├── docker-compose.yml
├── next.config.mjs
├── package.json
└── .github/
    └── workflows/
        └── ci.yml
```

---

# ⚙️ Getting Started

## Prerequisites

- Node.js 22+
- npm
- Git

## 1. Clone the repository

```bash
git clone https://github.com/priyanshu-kumar952/medico-an-e-commerce-web-application.git
cd medico-an-e-commerce-web-application
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env.local` file:

```env
JWT_SECRET=your_jwt_secret

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> Never commit real secrets to Git.

## 4. Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The SQLite database is initialized automatically.

---

# 🐳 Docker

Build the production image:

```bash
docker build -t medico .
```

Run it:

```bash
docker run -d \
  --name medico \
  -p 3000:3000 \
  -v medico-db-data:/app/data \
  --env-file .env \
  medico
```

The persistent volume is important because SQLite data lives in `/app/data`.

---

# 📡 API Overview

Medico exposes its backend through Next.js Route Handlers.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/medicines` | Search medicines |
| `POST` | `/api/medicines` | Create medicine |
| `GET` | `/api/medicines/[id]` | Get medicine |
| `DELETE` | `/api/medicines/[id]` | Delete medicine |
| `GET` | `/api/medicines/inventory` | Inventory with batches |
| `POST` | `/api/orders` | Create order |
| `GET` | `/api/orders` | List orders |
| `GET` | `/api/orders/[id]` | Get order details |
| `PATCH` | `/api/orders/[id]` | Update/cancel order |
| `POST` | `/api/auth` | Staff/Admin authentication |
| `POST` | `/api/batches` | Create batch |
| `PUT` | `/api/batches/[id]` | Update batch |
| `DELETE` | `/api/batches/[id]` | Delete batch |
| `GET` | `/api/inventory/logs` | Inventory audit logs |
| `GET` | `/api/stats` | Dashboard KPIs |
| `GET` | `/api/stats/daily-sales` | Daily sales |
| `GET` | `/api/stats/medicines` | Medicine sales insights |
| `POST` | `/api/otp` | OTP operations |
| `GET` | `/api/health` | Application health check |

---

# 🧪 Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint checks
```

---

# 📈 Engineering Highlights

This project gave me hands-on experience with:

- Full-stack Next.js architecture
- REST-style API design
- Relational database modeling
- SQLite transactions
- Batch-level inventory systems
- Role-based authorization
- JWT session management
- Password hashing
- Input validation
- Rate limiting
- Audit logging
- Analytics and data visualization
- Docker containerization
- Linux server administration
- AWS EC2 deployment
- AWS IAM
- AWS Systems Manager
- GitHub OIDC
- GitHub Actions CI/CD
- Container registries
- Reverse proxy configuration
- Persistent application storage

More importantly, it taught me how to take a **real-world business workflow and turn it into a working software system from the ground up**.

---

# 🗺️ Future Roadmap

Possible future improvements include:

- [ ] Custom domain + HTTPS
- [ ] Production-grade centralized logging
- [ ] Automated database backups
- [ ] Externalized rate limiting
- [ ] Improved container hardening
- [ ] PostgreSQL migration for multi-instance scaling
- [ ] Prescription upload and processing workflow
- [ ] Online payment integration
- [ ] Home delivery workflow
- [ ] Automated notifications
- [ ] More advanced pharmacy analytics

The current architecture intentionally remains simple because the application is designed around a single-server SQLite deployment.

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Commit your changes

```bash
git commit -m "Add your feature"
```

4. Push the branch

```bash
git push origin feature/your-feature
```

5. Open a Pull Request

---

# 👨‍💻 About the Developer

## Priyanshu Kumar

**B.Tech Computer Science & Technology Student**

I enjoy building software by taking real problems and turning them into complete, usable systems.

Medico is one of my first serious full-stack projects, but I intentionally treated it as more than a college assignment. It involved product thinking, database design, backend engineering, frontend development, security considerations, cloud infrastructure, deployment automation, and continuous iteration.

### GitHub

[@priyanshu-kumar952](https://github.com/priyanshu-kumar952)

### Project

[Medico — Pharmacy E-Commerce & Management Platform](https://github.com/priyanshu-kumar952/medico-an-e-commerce-web-application)

---

<div align="center">

### Built for a real business. Designed as a real system. Deployed to the cloud.

**If you found the project interesting, consider ⭐ starring the repository.**

</div>
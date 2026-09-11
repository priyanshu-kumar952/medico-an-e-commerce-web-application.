# 💊 Medico — Pharmacy E-Commerce & Management Platform

### A full-stack platform built around the real operational workflow of a neighborhood pharmacy.

Medico is a full-stack pharmacy e-commerce and management platform built around the real-world workflow of **Mithila Medico, Gardanibagh, Patna, Bihar**.

The platform brings customer ordering, pharmacy operations, batch-level inventory, billing, analytics, and audit logging into a single system.

**Next.js · React · SQLite · Docker · AWS**

> 🚀 **Deployed on AWS EC2 with Docker and automated CI/CD through GitHub Actions.**
>
> 🟢 Core ordering, inventory, staff, owner, and analytics workflows are operational.
>
> 🟡 Customer phone OTP and Google Maps integration are not currently active in production.

---

## 🌐 Live Demo

**Live Application:**  
http://43.204.216.145/

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Why I Built This](#-why-i-built-this)
- [Features](#-features)
  - [Customer Experience](#-customer-experience)
  - [Staff Operations](#-staff-operations)
  - [Owner / Admin Dashboard](#-owner--admin-dashboard)
- [Screenshots](#-screenshots)
- [System Architecture](#-system-architecture)
- [Authentication and Security](#-authentication-and-security)
- [Database Design](#-database-design)
- [Order and Billing Logic](#-order-and-billing-logic)
- [Analytics and Audit Logging](#-analytics-and-audit-logging)
- [Tech Stack](#-tech-stack)
- [Deployment Architecture](#-deployment-architecture)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Testing and QA](#-testing-and-qa)
- [Getting Started](#-getting-started)
- [Current Limitations](#-current-limitations)
- [Roadmap](#-roadmap)
- [AI-Assisted Development](#-ai-assisted-development)
- [What This Project Demonstrates](#-what-this-project-demonstrates)
- [Project Status](#-project-status)
- [Author and Contact](#-author-and-contact)
- [Built For](#-built-for)
- [License](#-license)

---

# 📌 Overview

Local pharmacies often operate through a combination of in-store purchases, phone calls, and WhatsApp messages.

Medico digitizes that workflow into a structured software system while keeping the operational simplicity of a local pharmacy.

The platform was built specifically around the workflow of **Mithila Medico in Gardanibagh, Patna, Bihar**.

The system serves three distinct roles from a single codebase:

| Role | Purpose |
|---|---|
| 👤 **Customer** | Search medicines, place orders, track status, and access order history |
| 👨‍💼 **Staff** | Process orders, select fulfillment batches, manage stock, and monitor alerts |
| 👑 **Owner / Admin** | Monitor operations, sales, inventory, analytics, and audit history |

---

# 💡 Why I Built This

This project started as a way to test whether I could design and deliver a complete software system before approaching businesses as a freelancer.

I was considering starting a freelancing agency with a friend. Rather than immediately trying to build something for a client, I decided to create a real-world prototype first.

I chose **Mithila Medico**, a pharmacy I already knew, as the case study because I was familiar with how the business operates locally.

The initial scope was deliberately small:

```text
Customer places an order
        ↓
Staff receives the order
        ↓
Staff packs the medicines
        ↓
Customer is notified
        ↓
Owner can monitor the operation
````

As I used and tested the system from the perspective of a customer, staff member, and owner, additional requirements naturally appeared.

The project gradually evolved to include:

* Batch-level inventory
* Expiry monitoring
* Stock validation
* Billing calculated during packing
* Sales analytics
* Date-range reporting
* Order audit logs
* Inventory audit logs
* Role-based authorization
* Transactional order processing
* Automated CI/CD deployment

What began as a small prototype became a considerably more complete pharmacy management system.

---

# ✨ Features

## 👤 Customer Experience

### Medicine Ordering

* Search medicines by name
* Add medicines to cart
* Adjust quantities
* Validate available stock
* Enter customer information
* Place pickup orders
* Optionally provide a delivery address
* Receive order confirmation
* Track order status
* Cancel eligible orders
* Download invoices
* View previous purchases

### Order Lifecycle

```text
Placed
   ↓
Packed
   ↓
Completed
```

Orders can also be cancelled when permitted by the workflow.

---

# 👨‍💼 Staff Operations

The Staff Panel provides the operational interface for receiving and processing customer orders.

## Order Management

Staff can:

* View incoming orders
* Search by order ID
* Search by customer name
* Search by phone number
* Search by bill information
* Filter orders by status
* Filter orders by date
* Sort orders
* Open individual orders
* Confirm prices
* Select the exact inventory batch used for fulfillment
* Pack orders
* Generate final billing information
* Cancel orders when required

## Inventory Operations

Staff can:

* View medicines
* View stock quantities
* Manage individual inventory batches
* Add medicines
* Add batches
* Update inventory
* Configure low-stock thresholds
* Monitor stock levels

## Inventory Alerts

The dashboard provides alerts for:

* 🔶 Low-stock medicines
* 🔴 Expired medicines
* 🟠 Critical upcoming expiries

---

# 👑 Owner / Admin Dashboard

The Owner Dashboard provides a higher-level view of pharmacy operations.

## Order Management

* Complete order overview
* Order status filtering
* Date-range filtering
* Order search
* Individual order details
* Order history
* Operational monitoring

## Sales Analytics

The dashboard provides:

* Total revenue
* Completed order count
* Average order value
* Units sold
* Daily revenue trends
* Top-selling medicines
* Daily performance breakdown
* Custom date-range analysis
* Predefined timeframe analysis

## Inventory Management

* Medicine management
* Batch management
* Stock monitoring
* Expiry monitoring
* Inventory history

## Audit & Logs

* Inventory logs
* Order logs
* Traceable operational history

---

# 🖼️ Screenshots

> Screenshots can be added to `docs/screenshots/` and referenced here as the repository is expanded.

## Customer Interface

### Pharmacy Landing Page

The customer-facing application provides pharmacy information, medicine ordering, order tracking, and access to previous orders.

![Customer Home Page](docs/screenshots/customer-home.png)

### Medicine Search & Cart

Customers can search for medicines, add them to their cart, adjust quantities, and place an order.

![Medicine Search and Cart](docs/screenshots/customer-order.png)

### Order Tracking

Customers can track order status and access billing information once the order has been processed.

![Order Tracking](docs/screenshots/order-tracking.png)

### Purchase History

Customers can retrieve previous orders and download available invoices.

![Purchase History](docs/screenshots/purchase-history.png)

---

## Staff Interface

### Staff Dashboard

The Staff Panel provides order counts, search, filtering, inventory access, and order management.

![Staff Dashboard](docs/screenshots/staff-dashboard.png)

### Order Processing & Batch Selection

Staff can inspect an order and select the exact inventory batch used to fulfill each requested medicine.

![Staff Order Processing](docs/screenshots/staff-order-processing.png)

### Inventory Alerts

Low-stock and expiry conditions are surfaced directly through the dashboard.

![Inventory Alerts](docs/screenshots/inventory-alerts.png)

---

## Owner Interface

### Sales Analytics

The Owner Dashboard provides revenue, order, sales, and performance analytics.

![Sales Analytics](docs/screenshots/sales-analytics.png)

### Inventory Management

The owner can manage medicines and their associated inventory batches.

![Inventory Management](docs/screenshots/inventory-management.png)

---

# 🏗️ System Architecture

Medico is implemented as a single Next.js application serving all three user interfaces and the backend API.

```text
                         MEDICO
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Customer           Staff           Owner
      Interface        Interface        Interface
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                   Next.js Application
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
             Frontend           API Routes
                                     │
                                     ▼
                              Business Logic
                                     │
                                     ▼
                              SQLite Database
                                     │
                                better-sqlite3
```

---

# 🔐 Authentication and Security

Medico implements server-side authentication and role-based authorization.

## Authentication

* Password hashing with `bcryptjs`
* JWT-based sessions
* `jose` for JWT operations
* HS256 signing
* Token expiration
* HTTP-only session cookies

## Authorization

Access is separated by role:

```text
Customer
   │
   └── Customer functionality

Staff
   │
   └── Order + Inventory operations

Owner / Admin
   │
   └── Full operational + analytical access
```

Protected routes perform server-side authorization checks rather than relying only on frontend visibility.

## Additional Protections

The application also uses:

* Input validation
* Server-side validation
* Rate limiting for sensitive operations
* Transactional database operations
* Foreign-key enforcement
* Database indexes on frequently queried data

---

# 🗄️ Database Design

Medico uses **SQLite** through `better-sqlite3`.

One of the key database design decisions is separating medicines from their individual inventory batches.

This allows stock and expiry information to be tracked at the **batch level**.

```text
Medicine
   │
   ├── Batch A
   │      ├── Quantity
   │      ├── MRP
   │      ├── Discount
   │      ├── Manufacturing Date
   │      └── Expiry Date
   │
   ├── Batch B
   │      ├── Quantity
   │      ├── MRP
   │      └── Expiry Date
   │
   └── Batch C
          └── ...
```

The database architecture also uses:

* Foreign keys
* WAL mode
* Indexes
* Transactions
* Database migrations
* Seed data
* Persistent production storage

---

# 💰 Order and Billing Logic

Stock and order state must remain consistent during fulfillment.

Order processing follows a controlled transactional workflow:

```text
Customer Order
      ↓
Validate Requested Quantities
      ↓
Create Order
      ↓
Staff Selects Actual Batch
      ↓
Validate Batch Stock
      ↓
Calculate Final Price
      ↓
Update Inventory
      ↓
Generate Bill
      ↓
Record Order History
```

A key business rule is that the **final price is calculated during packing**, based on the actual inventory batch selected by staff.

This means the price used for the final bill can reflect the actual batch that was fulfilled rather than assuming every batch of a medicine has identical pricing.

---

# 📊 Analytics and Audit Logging

## Analytics

The Owner Dashboard provides:

* Total revenue
* Daily revenue
* Revenue trends
* Order counts by status
* Units sold
* Average order value
* Top-selling medicines
* Daily sales performance
* Custom date-range reporting

Order statuses include:

```text
Placed
Packed
Completed
Cancelled
```

## Audit Logging

The system maintains separate operational records for:

* Order activity
* Inventory activity

This provides visibility into how orders and stock changed over time.

---

# 🛠️ Tech Stack

| Category           | Technology                |
| ------------------ | ------------------------- |
| Framework          | Next.js 16                |
| Frontend           | React 19                  |
| Language           | JavaScript                |
| Database           | SQLite                    |
| Database Driver    | better-sqlite3            |
| Authentication     | JWT                       |
| JWT Library        | jose                      |
| Password Hashing   | bcryptjs                  |
| Customer OTP       | Firebase                  |
| Charts             | Recharts                  |
| Icons              | Lucide React              |
| Containerization   | Docker                    |
| Reverse Proxy      | Caddy                     |
| Cloud Hosting      | AWS EC2                   |
| Container Registry | GitHub Container Registry |
| CI/CD              | GitHub Actions            |
| AWS Authentication | GitHub OIDC + IAM         |
| Remote Deployment  | AWS Systems Manager       |
| Operating System   | Linux                     |

---

# ☁️ Deployment Architecture

The production application is deployed on AWS EC2.

```text
                         Internet
                            │
                            ▼
                     AWS EC2 Instance
                            │
                            ▼
                         Caddy :80
                       Reverse Proxy
                            │
                            ▼
                    Docker Container
                       ┌───────────┐
                       │  Medico   │
                       │ Next.js   │
                       │   :3000   │
                       └─────┬─────┘
                             │
                             ▼
                      SQLite Database
                             │
                             ▼
                    Persistent Volume
```

Caddy proxies incoming requests to the Next.js application running inside Docker.

The SQLite database is stored using persistent storage so that replacing the application container does not wipe application data.

---

# 🔄 CI/CD Pipeline

Medico uses GitHub Actions for automated validation, container publishing, and deployment.

```text
Developer
    │
    ▼
Git Push
    │
    ▼
GitHub Repository
    │
    ▼
GitHub Actions
    │
    ├── Install dependencies
    ├── ESLint
    └── Next.js production build
    │
    ▼
Docker Image Build
    │
    ▼
GitHub Container Registry
    │
    ▼
AWS OIDC / IAM
    │
    ▼
AWS Systems Manager
    │
    ▼
EC2 Instance
    │
    ├── Pull latest image
    ├── Replace application container
    └── Preserve persistent database volume
    │
    ▼
Health Check
    │
    ▼
Deployed Application
```

This provides an automated path from a code change to a deployed production container.

---

# 🐳 Docker

The production application runs inside a Docker container.

Containerization provides:

* Consistent runtime environment
* Reproducible builds
* Simplified deployment
* Application isolation
* Easy container replacement
* Persistent database storage outside the application container

---

# 📁 Project Structure

```text
medico/
│
├── .github/
│   └── workflows/
│
├── app/
│   ├── about/
│   ├── admin/
│   │   └── dashboard/
│   ├── staff/
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── orders/
│   ├── history/
│   ├── order-confirmation/
│   ├── track/
│   │
│   └── api/
│       ├── auth/
│       ├── batches/
│       ├── health/
│       ├── inventory/
│       ├── medicines/
│       ├── order-logs/
│       ├── orders/
│       ├── otp/
│       └── stats/
│
├── components/
├── lib/
├── public/
├── scripts/
│
├── Dockerfile
├── docker-compose.yml
├── next.config.mjs
├── migrate_db.js
├── package.json
└── README.md
```

---

# 🔌 API Reference

The backend is implemented using **Next.js Route Handlers**.

| Endpoint                    | Purpose                                     |
| --------------------------- | ------------------------------------------- |
| `/api/auth`                 | Authentication and session handling         |
| `/api/medicines`            | Medicine catalog operations                 |
| `/api/medicines/[id]`       | Single medicine details and updates         |
| `/api/medicines/[id]/stock` | Stock information for a medicine            |
| `/api/medicines/inventory`  | Combined medicine and inventory information |
| `/api/batches`              | Batch-level inventory management            |
| `/api/batches/[id]`         | Individual batch operations                 |
| `/api/inventory/logs`       | Inventory audit logs                        |
| `/api/orders`               | Order creation and listing                  |
| `/api/orders/[id]`          | Individual order details                    |
| `/api/orders/[id]/pack`     | Batch selection, packing, and billing       |
| `/api/order-logs`           | Order audit logs                            |
| `/api/stats`                | General dashboard statistics                |
| `/api/stats/daily-sales`    | Daily sales breakdown                       |
| `/api/stats/medicines`      | Medicine sales statistics                   |
| `/api/otp/send`             | Customer phone OTP                          |
| `/api/otp/verify`           | Customer phone OTP verification             |
| `/api/health`               | Application health check                    |

---

# 🧪 Testing and QA

The application has been manually tested from the perspective of all three major roles:

```text
Customer
   ↓
Staff
   ↓
Owner / Admin
```

Testing focused on complete business workflows rather than isolated UI components.

### Customer Workflows

* Medicine search
* Cart operations
* Order placement
* Order tracking
* Purchase history

### Staff Operations

* Order processing
* Batch selection
* Inventory operations
* Low-stock alerts
* Expiry alerts
* Order filtering

### Dashboards & Analytics

* Order filtering
* Date-range filtering
* Sales analytics
* Dashboard statistics

### Authentication, Data & Infrastructure

* Authentication
* Authorization
* Database operations
* Docker deployment
* CI/CD deployment

---

# 🚀 Getting Started

## Prerequisites

* Node.js
* npm
* Git

## Clone the Repository

```bash
git clone https://github.com/priyanshu-kumar952/medico-an-e-commerce-web-application.git
cd medico-an-e-commerce-web-application
```

## Install Dependencies

```bash
npm install
```

## Initialize the Database

```bash
node migrate_db.js
```

## Start Development Server

```bash
npm run dev
```

The application will run at:

```text
http://localhost:3000
```

## Production Build

```bash
npm run build
npm start
```

---

# 🔑 Environment Variables

Create a `.env.local` file and provide the environment-specific values required by the application.

Example:

```env
JWT_SECRET=your-secret-key

FIREBASE_API_KEY=your-firebase-key
FIREBASE_AUTH_DOMAIN=your-firebase-domain
FIREBASE_PROJECT_ID=your-firebase-project-id

DATABASE_PATH=./data/medico.db
```

> **Never commit real secrets, Firebase credentials, production database files, or private infrastructure credentials to the repository.**

---

# 🐳 Run with Docker

```bash
docker-compose up --build
```

The application will then be available through the configured Docker port.

---

# ⚠️ Current Limitations

## Customer Phone OTP

Firebase Phone Authentication is implemented in the application, but production SMS verification requires the appropriate Firebase billing configuration.

Therefore, customer phone OTP is currently not active in production.

## Google Maps

The pharmacy location integration is not functioning as intended yet.

The project uses publicly available location information for Mithila Medico and does **not** use private Google credentials belonging to the business.

These integrations are planned for future refinement.

---

# 🗺️ Roadmap

* [ ] Enable production phone OTP verification
* [ ] Fix and improve Google Maps integration
* [ ] Add HTTPS and a custom domain
* [ ] Improve automated test coverage
* [ ] Add more advanced analytics
* [ ] Improve mobile experience
* [ ] Expand notification capabilities
* [ ] Add additional pharmacy operational features
* [ ] Improve deployment observability

---

# 🤖 AI-Assisted Development

AI tools were used extensively throughout development as engineering assistants.

The development workflow included:

* **ChatGPT**
* **Antigravity IDE and its native AI agent**

AI assistance was used for:

* Brainstorming
* Technical research
* Architecture exploration
* Coding assistance
* Debugging
* Error analysis
* Refactoring
* Exploring implementation alternatives
* QA reasoning
* Deployment troubleshooting

The overall product direction, requirements, architecture decisions, feature prioritization, testing, and deployment decisions were driven and evaluated by the developer.

The project followed an iterative development cycle:

```text
Idea
 ↓
Prototype
 ↓
Real-world usage
 ↓
Identify problems
 ↓
Implement solution
 ↓
Test
 ↓
Refine
 ↓
Deploy
```

---

# 📈 What This Project Demonstrates

## Full-Stack Engineering

* Next.js App Router
* React
* REST-style API design
* Relational data modeling
* Order lifecycle design
* Billing logic
* Batch-level inventory management
* Analytics
* Audit logging

## Security

* JWT sessions
* Password hashing
* Role-based access control
* Server-side authorization
* Server-side validation
* Rate limiting

## Database Engineering

* SQLite
* Relational schema design
* Transactions
* Foreign keys
* Indexing
* WAL mode
* Migrations
* Persistent storage

## DevOps & Cloud Infrastructure

* Docker
* Linux server administration
* AWS EC2
* GitHub Actions
* GitHub Container Registry
* AWS IAM
* GitHub OIDC
* AWS Systems Manager
* Caddy reverse proxy

---

# 📊 Project Status

### Current Status: 🟢 Core System Operational

| Area                     | Status                              |
| ------------------------ | ----------------------------------- |
| Customer ordering        | ✅ Operational                       |
| Medicine search          | ✅ Operational                       |
| Cart                     | ✅ Operational                       |
| Order tracking           | ✅ Operational                       |
| Purchase history         | ✅ Operational                       |
| Staff dashboard          | ✅ Operational                       |
| Order processing         | ✅ Operational                       |
| Batch management         | ✅ Operational                       |
| Inventory management     | ✅ Operational                       |
| Expiry monitoring        | ✅ Operational                       |
| Owner dashboard          | ✅ Operational                       |
| Sales analytics          | ✅ Operational                       |
| Audit logs               | ✅ Operational                       |
| JWT authentication       | ✅ Operational                       |
| Role-based authorization | ✅ Operational                       |
| Docker deployment        | ✅ Operational                       |
| AWS deployment           | ✅ Operational                       |
| GitHub Actions CI/CD     | ✅ Operational                       |
| Phone OTP                | 🟡 Pending production configuration |
| Google Maps              | 🟡 Needs further work               |
| HTTPS / custom domain    | 🔵 Planned                          |

---

# 👨‍💻 Author and Contact

## Priyanshu Kumar

**B.Tech — Computer Science & Technology**
**SAGE University, Indore | 2026–2030**

Interested in:

* Software Engineering
* Full-Stack Development
* Backend Systems
* AI/ML
* System Architecture

I primarily learn by building real systems, understanding how they work, and applying technical concepts to practical problems.

### Contact

| Platform     | Details                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| 📧 Email     | `krpriyanshu952@gmail.com`                                                                  |
| 📱 Phone     | `7004022705`                                                                                |
| 💼 LinkedIn  | [linkedin.com/in/anshu-kumar-8735ba377](https://www.linkedin.com/in/anshu-kumar-8735ba377/) |
| 🐙 GitHub    | [github.com/priyanshu-kumar952](https://github.com/priyanshu-kumar952)                      |
| 🌐 Portfolio | Coming Soon                                                                                 |

---

# 🏪 Built For

## Mithila Medico

**Gauriya Math, Gandhi Path, Jakkanpur, Gardanibagh**
**Patna, Bihar 800001**

Medico was developed as a real-world software prototype based on the operating workflow of this local pharmacy.

The project uses publicly available business information for the pharmacy and does not use private Google credentials or private business credentials.

---

# 📄 License

No open-source license has been specified yet.

Until a `LICENSE` file is added to the repository, the project remains **all rights reserved by the author**.

---

<p align="center">

### 💊 Medico

**Turning a real pharmacy workflow into a complete software system.**

Built with **Next.js · React · SQLite · Docker · AWS**

</p>
```

# 🚚 Last-Mile Delivery Tracker

### 📦 Smart Delivery Management Platform

A full-stack **Last-Mile Delivery Management System** that helps customers, delivery agents, and administrators manage the complete delivery lifecycle — from **order creation and automated pricing to agent assignment, real-time tracking, failed delivery handling, and notifications**.

---

## ✨ Features

### 👤 Customer

* 🔐 Register & Login
* 📦 Create delivery orders
* 📐 Enter package dimensions `(Length × Breadth × Height)`
* ⚖️ Automatic volumetric weight calculation
* 💰 View delivery charges before confirmation
* 🏷️ Support for **B2B & B2C** orders
* 💳 Support for **Prepaid & COD**
* 📍 Track the order status
* 🕐 View complete tracking timeline
* 🔔 Receive delivery notifications
* 🔄 Reschedule failed deliveries

### 🛠️ Admin

* 👥 Manage customers and delivery agents
* 🗺️ Configure delivery zones
* 📍 Assign areas to zones
* 💵 Configure B2B/B2C rate cards
* 🚚 Configure intra-zone & inter-zone rates
* 💰 Configure COD surcharge
* 📦 Create orders on behalf of customers
* 👀 View all orders
* 🔎 Filter orders by status, zone & agent
* 👨‍✈️ Manually assign delivery agents
* 🤖 Trigger automatic agent assignment
* 🔄 Override order status

### 🛵 Delivery Agent

* 🔐 Secure login
* 📦 View assigned deliveries
* 📍 Manage assigned orders
* 🔄 Update delivery status
* ❌ Mark deliveries as failed
* ✅ Complete successful deliveries

---

# 🧑‍💻 Tech Stack

| Layer                | Technology           |
| -------------------- | -------------------- |
| 🎨 Frontend          | React.js             |
| ⚡ Build Tool         | Vite                 |
| 🖥️ Backend          | Node.js + Express.js |
| 🗄️ Database         | SQLite               |
| 🔐 Authentication    | JWT                  |
| 🔑 Password Security | bcrypt               |
| 📧 Email             | Nodemailer / SMTP    |
| 🌐 API               | REST API             |
| 🧪 API Testing       | Postman              |
| 📦 Package Manager   | npm                  |
| 🐙 Version Control   | Git + GitHub         |

---

# 🏗️ Project Architecture

```text
                 ┌─────────────────────┐
                 │      👤 Customer     │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   🎨 React Frontend │
                 │        + Vite       │
                 └──────────┬──────────┘
                            │
                       REST API
                            │
                            ▼
                 ┌─────────────────────┐
                 │  ⚡ Express Backend │
                 │                     │
                 │ 🔐 Authentication   │
                 │ 💰 Rate Engine      │
                 │ 🤖 Assignment       │
                 │ 📦 Order Management │
                 │ 🔔 Notifications    │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    🗄️ SQLite DB     │
                 │                     │
                 │ 👥 Users            │
                 │ 📦 Orders           │
                 │ 🗺️ Zones            │
                 │ 💵 Rate Cards       │
                 │ 🕐 Tracking History │
                 └─────────────────────┘
```

---

# 📂 Project Structure

```text
LastMile Delivery Tracker/
│
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 db/
│   │   │   ├── index.js
│   │   │   ├── migrate.js
│   │   │   ├── schema.sql
│   │   │   └── seed.js
│   │   │
│   │   ├── 📁 routes/
│   │   ├── 📁 middleware/
│   │   ├── 📁 services/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── 📁 frontend/
│   ├── 📁 public/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   ├── 📁 pages/
│   │   ├── api.js
│   │   └── ...
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── index.html
│
├── 📄 .gitignore
└── 📄 README.md
```

> 🚫 `node_modules`, `.env`, `dist`, `build`, logs and editor-specific files are excluded from Git.

---

# 🔐 Role-Based Authentication

The application uses **JWT-based authentication** with three user roles:

```text
👤 Customer
      │
      ├── Create orders
      ├── Track deliveries
      └── Reschedule failed deliveries

🛵 Delivery Agent
      │
      ├── View assigned orders
      └── Update delivery status

👨‍💼 Admin
      │
      ├── Manage zones
      ├── Configure pricing
      ├── Assign agents
      └── Manage orders
```

Protected API requests use:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

# 💰 Smart Rate Calculation Engine

One of the core features of the platform is its **dynamic delivery pricing engine**.

The charge is calculated automatically based on:

* 📍 Pickup zone
* 📍 Drop zone
* 📦 Package dimensions
* ⚖️ Actual weight
* 🏷️ B2B/B2C order type
* 💳 Prepaid/COD payment type
* 💵 Configured rate card

---

## 📐 1. Volumetric Weight

The system calculates volumetric weight using:

```text
Volumetric Weight =
Length × Breadth × Height ÷ 5000
```

### Example

```text
Length  = 50 cm
Breadth = 40 cm
Height  = 30 cm

Volumetric Weight
= 50 × 40 × 30 ÷ 5000
= 12 kg
```

---

## ⚖️ 2. Billable Weight

The system compares actual and volumetric weight.

```text
Billable Weight =
MAX(Actual Weight, Volumetric Weight)
```

Example:

```text
Actual Weight     = 10 kg
Volumetric Weight = 12 kg

➡️ Billable Weight = 12 kg
```

---

## 🗺️ 3. Zone Detection

The system identifies:

```text
Pickup Address → Pickup Zone
Drop Address   → Drop Zone
```

Then determines whether the delivery is:

### 🟢 Intra-Zone

```text
Pickup Zone = Drop Zone
```

### 🔵 Inter-Zone

```text
Pickup Zone ≠ Drop Zone
```

---

## 💵 4. Rate Card Selection

The appropriate rate card is selected based on:

```text
Order Type
     +
Zone Type
     +
Billable Weight
```

Supported combinations:

```text
B2B + Intra-Zone
B2B + Inter-Zone

B2C + Intra-Zone
B2C + Inter-Zone
```

✨ Rates are **admin-configurable** and are not hardcoded into the application.

---

## 💳 5. COD Surcharge

If the order uses COD:

```text
Final Charge =
Base Delivery Charge + COD Surcharge
```

For prepaid orders:

```text
COD Surcharge = ₹0
```

---

## 🧮 Complete Pricing Flow

```text
📦 Package Dimensions
        │
        ▼
📐 Volumetric Weight
        │
        ▼
⚖️ Compare Actual vs Volumetric
        │
        ▼
⚖️ Billable Weight
        │
        ▼
🗺️ Detect Zones
        │
        ▼
🏷️ B2B / B2C Rate Card
        │
        ▼
💳 Apply COD Surcharge
        │
        ▼
💰 Final Delivery Charge
```

The customer sees the calculated charge **before confirming the order**.

---

# 🤖 Intelligent Agent Assignment

The platform supports two assignment methods.

### 👨‍💼 Manual Assignment

An administrator can manually select a delivery agent.

### 🤖 Automatic Assignment

The system identifies suitable available agents based on:

* 🟢 Agent availability
* 📍 Current location
* 🗺️ Delivery zone

The system prioritizes an available agent who is closest to the delivery requirement.

---

# 📦 Order Lifecycle

Every order follows a controlled delivery lifecycle.

```text
📝 Created
   │
   ▼
📦 Picked Up
   │
   ▼
🚚 In Transit
   │
   ▼
🛵 Out for Delivery
   │
   ▼
🎉 Delivered
```

A delivery can also enter:

```text
❌ Failed
```

---

# 🕐 Immutable Tracking History

Every status change is stored as a separate tracking event.

Each event records:

```text
📦 Order ID
🔄 Previous Status
➡️ New Status
👤 Actor
🕐 Timestamp
```

Example:

```text
10:00 AM  📝 Created          — Customer
11:30 AM  📦 Picked Up        — Agent
02:15 PM  🚚 In Transit       — Agent
05:00 PM  🛵 Out for Delivery — Agent
06:30 PM  🎉 Delivered        — Agent
```

🔒 Previous tracking records are not modified when a new status is created, providing an auditable delivery history.

---

# ❌ Failed Delivery & Rescheduling

If a delivery attempt fails:

```text
🛵 Delivery Attempt
        │
        ▼
❌ Delivery Failed
        │
        ▼
🔔 Customer Notification
        │
        ▼
📅 Customer Selects New Date
        │
        ▼
🔄 Order Rescheduled
        │
        ▼
🤖 Agent Reassignment
        │
        ▼
🛵 New Delivery Attempt
```

This allows failed deliveries to continue through a new delivery attempt instead of permanently closing the order.

---

# 🔔 Notifications

Customers receive email notifications when important order events occur.

Examples:

* 📝 Order Created
* 📦 Order Picked Up
* 🚚 Order In Transit
* 🛵 Out for Delivery
* 🎉 Order Delivered
* ❌ Delivery Failed
* 📅 Delivery Rescheduled

Email delivery is handled through **Nodemailer/SMTP**.

---

# 🗄️ Database Design

The database contains the core entities required for the delivery platform.

### 👥 Users

Stores customers, delivery agents and administrators.

```text
users
├── id
├── name
├── email
├── password
├── role
└── created_at
```

### 🗺️ Zones

Stores delivery zones.

```text
zones
├── id
├── name
└── ...
```

### 📍 Areas

Maps delivery areas to zones.

```text
areas
├── id
├── name
└── zone_id
```

### 💵 Rate Cards

Stores configurable pricing rules for:

```text
B2B / B2C
+
Intra-Zone / Inter-Zone
+
Weight Range
```

### 📦 Orders

Stores complete order information including:

```text
orders
├── id
├── customer_id
├── agent_id
├── order_type
├── payment_type
├── pickup_address
├── drop_address
├── pickup_zone
├── drop_zone
├── length
├── breadth
├── height
├── actual_weight
├── volumetric_weight
├── billable_weight
├── delivery_charge
├── cod_surcharge
├── total_charge
├── status
└── created_at
```

### 🕐 Tracking History

Stores every status transition.

```text
tracking_history
├── id
├── order_id
├── previous_status
├── new_status
├── actor_id
└── created_at
```

---

# 🌐 API Overview

## 🔐 Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

---

## 📦 Orders

```http
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
```

---

## 🛵 Agent Operations

```http
GET   /api/orders
PATCH /api/orders/:id/status
```

---

## 👨‍💼 Admin Operations

Admin APIs provide functionality for:

```text
🗺️ Zone Management
📍 Area Management
💵 Rate Card Management
💳 COD Configuration
👨‍✈️ Agent Assignment
📦 Order Management
🔎 Order Filtering
🔄 Status Override
```

> 📌 Refer to the backend route files for the complete endpoint implementation and request/response formats.

---

# ⚙️ Environment Variables

Create:

```text
backend/.env
```

Example:

```env
PORT=4000

JWT_SECRET=your_secure_jwt_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

⚠️ **Never commit the actual `.env` file.**

For submission, provide:

```text
.env.example
```

containing only variable names/placeholders.

---

# 🚀 Getting Started

## 📋 Prerequisites

Make sure you have installed:

* 🟢 Node.js
* 🟢 npm
* 🟢 Git
* 🧪 Postman

---

## 1️⃣ Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd "LastMile Delivery Tracker"
```

---

# ⚡ Backend Setup

Navigate to:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create your `.env` file and configure the required variables.

### 🗄️ Run Database Migration

```bash
node src/db/migrate.js
```

### 🌱 Seed Initial Data

```bash
node src/db/seed.js
```

### ▶️ Start Backend

```bash
npm start
```

Backend:

```text
http://localhost:4000
```

---

# 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🧪 API Testing with Postman

Recommended testing sequence:

```text
1️⃣ Register User
      ↓
2️⃣ Login
      ↓
3️⃣ Copy JWT Token
      ↓
4️⃣ Configure Zones
      ↓
5️⃣ Configure Rate Cards
      ↓
6️⃣ Create Order
      ↓
7️⃣ Verify Calculated Charge
      ↓
8️⃣ Assign Delivery Agent
      ↓
9️⃣ Update Delivery Status
      ↓
🔟 Verify Tracking Timeline
      ↓
1️⃣1️⃣ Test Failed Delivery
      ↓
1️⃣2️⃣ Test Rescheduling
      ↓
1️⃣3️⃣ Verify Email Notification
```

For protected endpoints:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 🏭 Production Build

Create a frontend production build using:

```bash
npm run build
```

The generated build directory is ignored by Git and should not be committed.

---

# 🔒 Security

The application follows basic security practices:

* 🔐 JWT authentication
* 🔑 Password hashing
* 🛡️ Role-based authorization
* 🔒 Environment-based secrets
* 🚫 `.env` excluded from Git
* 🚫 `node_modules` excluded from Git
* 🛡️ Protected admin endpoints
* ✅ Server-side validation

---

# 📊 Core Business Flow

```text
👤 Customer
    │
    ▼
📦 Create Order
    │
    ▼
📍 Pickup + Drop Address
    │
    ▼
🗺️ Zone Detection
    │
    ▼
📐 Volumetric Weight
    │
    ▼
⚖️ Billable Weight
    │
    ▼
💵 Rate Card Lookup
    │
    ▼
💳 COD Surcharge
    │
    ▼
💰 Final Charge
    │
    ▼
✅ Customer Confirmation
    │
    ▼
🤖 Agent Assignment
    │
    ▼
📦 Delivery
    │
    ├── 📦 Picked Up
    ├── 🚚 In Transit
    ├── 🛵 Out for Delivery
    └── 🎉 Delivered
            │
            OR
            ▼
        ❌ Failed
            │
            ▼
        📅 Reschedule
            │
            ▼
        🤖 Reassign Agent
```

---

# 🎯 Evaluation Requirements Covered

| Requirement           | Implementation               |
| --------------------- | ---------------------------- |
| 💰 Rate Calculation   | Dynamic rate engine          |
| 📐 Volumetric Weight  | `L × B × H ÷ 5000`           |
| ⚖️ Billable Weight    | Higher of actual/volumetric  |
| 🏷️ B2B/B2C           | Separate rate cards          |
| 🗺️ Zone Pricing      | Intra/Inter-zone             |
| 💳 COD                | Configurable surcharge       |
| 🤖 Agent Assignment   | Manual + automatic           |
| 📍 Agent Availability | Availability + zone/location |
| 🕐 Tracking           | Immutable status history     |
| ❌ Failed Delivery     | Reschedule + reassignment    |
| 🔔 Notifications      | Email notifications          |
| 👨‍💼 Admin           | Full operational control     |
| 🔐 Authentication     | JWT + role-based access      |

---

# 📦 Submission Deliverables

### 1️⃣ GitHub Repository

```text
Branch: main
Visibility: Public
```

🔗 Repository:

```text
<YOUR_GITHUB_REPOSITORY_URL>
```

### 2️⃣ Complete Source Code

```text
📁 backend
📁 frontend
📄 README.md
📄 .env.example
```

### 3️⃣ Hosted Application

```text
🌐 <YOUR_DEPLOYED_APPLICATION_URL>
```

### 4️⃣ System Design

The project architecture covers:

* 💰 Rate calculation engine
* 🗺️ Zone detection
* 🤖 Auto-assignment
* 🕐 Tracking lifecycle
* ❌ Failed delivery handling

---

# ✅ Final Submission Checklist

* [ ] 🌐 GitHub repository is public
* [ ] 🌿 Branch is `main`
* [ ] 🚀 Application runs without errors
* [ ] 🎨 Frontend works
* [ ] ⚡ Backend works
* [ ] 🗄️ Database migration works
* [ ] 🌱 Seed data works
* [ ] 🔐 Authentication works
* [ ] 👥 Role-based authorization works
* [ ] 💰 Rate calculation works
* [ ] 📐 Volumetric weight works
* [ ] ⚖️ Billable weight works
* [ ] 🏷️ B2B/B2C rates work
* [ ] 🗺️ Intra/Inter-zone pricing works
* [ ] 💳 COD surcharge works
* [ ] 🤖 Agent assignment works
* [ ] 🕐 Tracking history works
* [ ] ❌ Failed delivery works
* [ ] 📅 Rescheduling works
* [ ] 🔔 Email notifications work
* [ ] 🔎 Admin filters work
* [ ] 🚫 No `node_modules`
* [ ] 🚫 No `.env`
* [ ] 🚫 No `dist/`
* [ ] 🚫 No `build/`
* [ ] 🚫 No `.vscode/`
* [ ] 📄 `.env.example` included
* [ ] 📚 Documentation completed

---

# 🌟 Project Goal

The goal of **Last-Mile Delivery Tracker** is to provide a reliable, configurable, and scalable logistics platform that automates delivery pricing, simplifies agent assignment, maintains transparent tracking history, and improves communication throughout the delivery journey.

---

## 👩‍💻 Developed As

🎓 **Full-Stack Application Project**

🚚 **Last-Mile Delivery Management System**

💻 **React + Node.js + Express + SQLite**

---

### ⭐ If you found this project useful, consider giving the repository a star!

**Made with ❤️ and ☕ for smarter last-mile logistics.**

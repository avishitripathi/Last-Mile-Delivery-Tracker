# 🚚 Last-Mile Delivery Tracker

A full-stack delivery management platform designed to streamline last-mile logistics through **automated rate calculation, intelligent delivery-agent assignment, real-time order tracking, and customer notifications**.

The platform supports customers, delivery agents, and administrators with role-based access and provides configurable pricing and delivery workflows.

---

## 🌐 Live Application

**Hosted Application:** `YOUR_DEPLOYED_URL`

**GitHub Repository:** `YOUR_GITHUB_REPOSITORY_URL`

---

## 📌 Features

### 👤 Customer

* Register and log in securely
* Create delivery orders
* Enter pickup and drop addresses
* Provide package dimensions and actual weight
* Select order type:

  * B2B
  * B2C
* Select payment type:

  * Prepaid
  * COD
* View calculated delivery charges before confirming the order
* View assigned delivery agent
* Track order status
* View complete delivery timeline
* Receive email/SMS notifications for status changes
* Reschedule failed deliveries

### 🛠️ Admin

* Secure admin authentication
* Create orders on behalf of customers
* Manage delivery zones
* Assign areas to zones
* Configure rate cards
* Configure separate B2B and B2C pricing
* Configure intra-zone and inter-zone rates
* Configure COD surcharge
* View all orders
* Filter orders by:

  * Status
  * Zone
  * Delivery agent
* Manually assign delivery agents
* Trigger automatic agent assignment
* Override order status
* Monitor delivery operations

### 🚴 Delivery Agent

* Secure agent authentication
* View assigned orders
* Update delivery status
* Update current availability
* Update location/zone
* Handle failed deliveries
* Receive reassigned orders after customer rescheduling

---

# ⚙️ Rate Calculation Engine

The delivery charge is calculated dynamically using administrator-configured rate cards.

No pricing values are hardcoded into the application.

## 1. Volumetric Weight

For every order, volumetric weight is calculated using:

```text
Volumetric Weight = (Length × Breadth × Height) / 5000
```

The system then determines the **chargeable weight**:

```text
Chargeable Weight = MAX(Actual Weight, Volumetric Weight)
```

### Example

```text
Length  = 50 cm
Breadth = 40 cm
Height  = 30 cm
Actual Weight = 8 kg

Volumetric Weight
= (50 × 40 × 30) / 5000
= 12 kg

Chargeable Weight
= MAX(8, 12)
= 12 kg
```

Therefore, the order is billed using **12 kg**.

---

## 2. Zone Detection

The pickup and drop addresses are mapped to predefined delivery areas.

Each area belongs to an administrator-configured zone.

```text
Pickup Address
      ↓
Pickup Area
      ↓
Pickup Zone

Drop Address
      ↓
Drop Area
      ↓
Drop Zone
```

The system compares the pickup and drop zones to determine whether the delivery is:

* **Intra-Zone** — pickup and drop are within the same zone
* **Inter-Zone** — pickup and drop belong to different zones

The appropriate rate card is then selected.

---

## 3. B2B / B2C Rate Card

The system selects the rate card based on the order type.

```text
Order Type
    │
    ├── B2B → B2B Rate Card
    │
    └── B2C → B2C Rate Card
```

The rate card also depends on whether the shipment is intra-zone or inter-zone.

```text
             Rate Card
                 │
       ┌─────────┴─────────┐
       │                   │
      B2B                 B2C
       │                   │
   ┌───┴───┐           ┌───┴───┐
   │       │           │       │
Intra   Inter       Intra   Inter
```

The final delivery charge is calculated using the configured rate corresponding to the chargeable weight.

---

## 4. COD Surcharge

If the payment type is **COD**, the configured COD surcharge for the selected order type is added.

```text
Base Delivery Charge
        +
COD Surcharge
        =
Final Delivery Charge
```

For prepaid orders:

```text
Final Charge = Base Delivery Charge
```

The calculated charge is displayed to the customer **before order confirmation**.

---

# 🚴 Auto-Assignment Logic

The platform supports both manual and automatic delivery-agent assignment.

## Manual Assignment

An administrator can select an available delivery agent and assign them to an order.

## Automatic Assignment

When auto-assignment is triggered, the system:

1. Identifies the delivery location/zone.
2. Finds available delivery agents.
3. Filters agents based on relevant zone/location.
4. Calculates proximity using the agent's current location where available.
5. Selects the nearest suitable available agent.
6. Assigns the order to that agent.
7. Updates the agent's assignment state.

Simplified flow:

```text
New Order
    ↓
Determine Delivery Location
    ↓
Find Available Agents
    ↓
Filter by Zone / Location
    ↓
Find Nearest Suitable Agent
    ↓
Assign Agent
    ↓
Notify Agent
```

---

# 📦 Order Status Lifecycle

Every order follows a controlled delivery lifecycle.

```text
Order Created
     ↓
Assigned
     ↓
Picked Up
     ↓
In Transit
     ↓
Out for Delivery
     ↓
Delivered
```

A delivery may also enter:

```text
Out for Delivery
       ↓
     Failed
       ↓
Customer Reschedules
       ↓
Agent Reassigned
       ↓
Out for Delivery
       ↓
Delivered
```

Supported statuses include:

* `Created`
* `Assigned`
* `Picked Up`
* `In Transit`
* `Out for Delivery`
* `Delivered`
* `Failed`

Administrators can also override an order status when required.

---

# 📝 Immutable Tracking History

Every status change creates a separate tracking-history record.

Each record contains information such as:

```text
Order ID
Previous Status
New Status
Changed By
Actor Role
Timestamp
Remarks
```

Tracking records are treated as **immutable historical events**.

Instead of modifying previous tracking records, a new record is created for every status transition.

Example:

```text
10:00 AM → Order Created → Customer
10:15 AM → Assigned      → Admin
12:30 PM → Picked Up     → Agent
03:00 PM → In Transit    → Agent
06:00 PM → Out for Delivery → Agent
07:15 PM → Delivered     → Agent
```

This allows customers and administrators to view the complete order journey.

---

# ❌ Failed Delivery & Rescheduling

When a delivery attempt fails:

1. The agent marks the order as `Failed`.
2. The failure is recorded in the tracking history.
3. The customer receives a notification.
4. The customer can select a new delivery date.
5. The rescheduling request is stored.
6. The order becomes eligible for reassignment.
7. A new delivery agent is assigned.
8. The new delivery attempt continues through the normal status lifecycle.

```text
Delivery Attempt
       ↓
     Failed
       ↓
Customer Notification
       ↓
Customer Reschedules
       ↓
New Delivery Date
       ↓
Agent Reassigned
       ↓
New Delivery Attempt
```

Previous tracking history remains preserved.

---

# 🔔 Notifications

Customers receive notifications whenever important order events occur.

Notifications can be sent through:

* Email
* SMS

Examples include:

* Order created
* Agent assigned
* Order picked up
* Order in transit
* Out for delivery
* Delivery failed
* Delivery rescheduled
* Order delivered

A free-tier notification provider can be configured using environment variables.

---

# 🏗️ System Architecture

```text
                    ┌───────────────────┐
                    │     Customer      │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   React Frontend  │
                    └─────────┬─────────┘
                              │
                         REST APIs
                              │
                    ┌─────────▼─────────┐
                    │   Backend Server  │
                    │ Authentication    │
                    │ Order Management  │
                    │ Rate Engine       │
                    │ Assignment Logic  │
                    │ Notifications     │
                    └──────┬─────┬──────┘
                           │     │
                 ┌─────────▼─┐ ┌─▼─────────────┐
                 │  Database │ │ Notification  │
                 │           │ │   Service     │
                 └───────────┘ └───────────────┘
```

---

# 🗃️ Database Design

The major entities include:

### Users

Stores customers, delivery agents, and administrators.

```text
users
-----
id
name
email
password
role
phone
created_at
updated_at
```

### Zones

Stores delivery zones configured by administrators.

```text
zones
-----
id
name
description
created_at
updated_at
```

### Areas

Maps delivery areas to zones.

```text
areas
-----
id
name
zone_id
created_at
updated_at
```

### Rate Cards

Stores configurable pricing rules.

```text
rate_cards
----------
id
order_type
zone_type
weight_from
weight_to
rate
created_at
updated_at
```

Where:

```text
order_type = B2B / B2C
zone_type  = INTRA / INTER
```

### COD Configuration

Stores COD surcharge configuration.

```text
cod_rates
---------
id
order_type
surcharge
created_at
updated_at
```

### Agents

Stores delivery-agent availability and location information.

```text
agents
------
id
user_id
current_latitude
current_longitude
zone_id
availability_status
created_at
updated_at
```

### Orders

Stores the primary order information.

```text
orders
------
id
customer_id
pickup_address
drop_address
pickup_zone_id
drop_zone_id
order_type
payment_type
length
breadth
height
actual_weight
volumetric_weight
chargeable_weight
delivery_charge
cod_surcharge
total_charge
assigned_agent_id
status
created_at
updated_at
```

### Tracking History

Stores immutable order status events.

```text
tracking_history
----------------
id
order_id
previous_status
new_status
actor_id
actor_role
remarks
created_at
```

### Reschedules

Stores failed-delivery rescheduling information.

```text
reschedules
-----------
id
order_id
previous_attempt
new_delivery_date
reason
created_at
```

---

# 🔐 Authentication & Authorization

The application uses role-based authentication.

Supported roles:

```text
CUSTOMER
DELIVERY_AGENT
ADMIN
```

Each role has access only to its permitted operations.

Example:

| Feature                | Customer | Agent | Admin |
| ---------------------- | -------: | ----: | ----: |
| Create Order           |        ✅ |     ❌ |     ✅ |
| View Own Orders        |        ✅ |     ❌ |     ✅ |
| Update Delivery Status |        ❌ |     ✅ |     ✅ |
| Assign Agent           |        ❌ |     ❌ |     ✅ |
| Configure Zones        |        ❌ |     ❌ |     ✅ |
| Configure Rates        |        ❌ |     ❌ |     ✅ |
| Override Status        |        ❌ |     ❌ |     ✅ |
| Reschedule Delivery    |        ✅ |     ❌ |     ✅ |

---

# 🛠️ Tech Stack

> Update this section according to the technologies actually used in your implementation.

### Frontend

* React.js
* Vite
* JavaScript / TypeScript
* Tailwind CSS
* React Router

### Backend

* Node.js
* Express.js
* REST API
* JWT Authentication

### Database

* MongoDB / MySQL

### Integrations

* Email notification service
* SMS notification service
* Geolocation / Maps API

### Deployment

* Vercel
* Render / Railway

---

# 📁 Project Structure

```text
last-mile-delivery-tracker/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── utils/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   └── package.json
│
├── .env.example
├── README.md
└── package.json
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git
* MongoDB / MySQL
* A configured email/SMS provider if notifications are enabled

---

## 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL

cd last-mile-delivery-tracker
```

---

## 2. Install Backend Dependencies

```bash
cd server
npm install
```

---

## 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=5000

DATABASE_URL=your_database_url

JWT_SECRET=your_jwt_secret

EMAIL_HOST=your_email_host
EMAIL_PORT=your_email_port
EMAIL_USER=your_email_username
EMAIL_PASSWORD=your_email_password

SMS_API_KEY=your_sms_api_key

MAPS_API_KEY=your_maps_api_key

CLIENT_URL=http://localhost:5173
```

Never commit the actual `.env` file to GitHub.

Use `.env.example` as the template for required environment variables.

---

# ▶️ Running the Application

### Start Backend

```bash
cd server
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

### Start Frontend

```bash
cd client
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

# 🔌 API Documentation

## Authentication

### Register Customer

```http
POST /api/auth/register
```

### Login

```http
POST /api/auth/login
```

---

## Orders

### Create Order

```http
POST /api/orders
```

### Get Customer Orders

```http
GET /api/orders/my-orders
```

### Get Order Details

```http
GET /api/orders/:id
```

### Calculate Delivery Charge

```http
POST /api/orders/calculate-charge
```

### Reschedule Failed Delivery

```http
POST /api/orders/:id/reschedule
```

---

## Agent

### Get Assigned Orders

```http
GET /api/agent/orders
```

### Update Order Status

```http
PATCH /api/agent/orders/:id/status
```

### Update Agent Location

```http
PATCH /api/agent/location
```

### Update Availability

```http
PATCH /api/agent/availability
```

---

## Admin

### Get All Orders

```http
GET /api/admin/orders
```

### Assign Agent

```http
PATCH /api/admin/orders/:id/assign
```

### Auto Assign Agent

```http
POST /api/admin/orders/:id/auto-assign
```

### Override Order Status

```http
PATCH /api/admin/orders/:id/status
```

### Manage Zones

```http
GET    /api/admin/zones
POST   /api/admin/zones
PATCH  /api/admin/zones/:id
DELETE /api/admin/zones/:id
```

### Manage Areas

```http
POST   /api/admin/areas
PATCH  /api/admin/areas/:id
DELETE /api/admin/areas/:id
```

### Manage Rate Cards

```http
GET   /api/admin/rates
POST  /api/admin/rates
PATCH /api/admin/rates/:id
```

---

# 💰 Rate Calculation Example

Suppose:

```text
Order Type       = B2C
Payment Type     = COD

Dimensions       = 50 × 40 × 30 cm
Actual Weight    = 8 kg

Pickup Zone      = Zone A
Drop Zone        = Zone B
```

### Step 1 — Calculate Volumetric Weight

```text
(50 × 40 × 30) / 5000
= 12 kg
```

### Step 2 — Determine Chargeable Weight

```text
MAX(8, 12)
= 12 kg
```

### Step 3 — Determine Zone Type

```text
Zone A → Zone B
= Inter-Zone
```

### Step 4 — Select Rate Card

```text
B2C + Inter-Zone + 12 kg
```

The system retrieves the corresponding rate from the database.

### Step 5 — Add COD Surcharge

```text
Delivery Charge
+
B2C COD Surcharge
=
Final Charge
```

The final amount is displayed to the customer before confirmation.

---

# 🧪 Testing

The application should be tested for:

* Customer registration/login
* Role-based authorization
* Order creation
* Zone detection
* Volumetric weight calculation
* Actual vs volumetric weight selection
* B2B rate calculation
* B2C rate calculation
* Intra-zone pricing
* Inter-zone pricing
* COD surcharge
* Agent assignment
* Auto-assignment
* Status transitions
* Immutable tracking history
* Failed delivery
* Rescheduling
* Agent reassignment
* Email/SMS notifications
* Admin status overrides

---

# 🔒 Security Considerations

* Passwords are stored using secure hashing.
* JWT-based authentication is used for protected APIs.
* Role-based middleware restricts unauthorized operations.
* Environment variables are used for secrets.
* Sensitive credentials are excluded from version control.
* Server-side validation is performed for order and pricing inputs.
* Customers can access only their authorized order information.
* Tracking history is stored as immutable events.

---

# 📊 Key Design Decisions

### Configurable Pricing

All rates, zones, and COD surcharges are stored in the database and managed by administrators. This allows pricing rules to be changed without modifying application code.

### Chargeable Weight

The system always bills using the higher value between actual and volumetric weight, ensuring that lightweight but bulky shipments are priced appropriately.

### Immutable Tracking

Each status change creates a new tracking event rather than modifying historical records. This provides a reliable audit trail.

### Intelligent Assignment

Auto-assignment considers agent availability and proximity/zone information to select a suitable delivery agent.

### Failed Delivery Handling

Failed deliveries are treated as new delivery attempts while preserving the original tracking history.

---

# 📈 Future Improvements

Potential future enhancements include:

* Real-time GPS tracking
* WebSocket-based live location updates
* Route optimization
* Delivery-agent workload balancing
* Dynamic pricing
* Advanced analytics dashboard
* Push notifications
* Proof of delivery using image/signature
* OTP-based delivery verification
* Estimated delivery time calculation
* Redis-based caching
* Background notification queues

---

# 👨‍💻 Author

**Avishi Tripathi**

Computer Science Engineering
VIT Bhopal University

---

# 📄 License

This project is developed for educational and demonstration purposes.

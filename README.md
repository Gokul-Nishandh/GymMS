# GymMS — Cloud-Based Gym Management & Payment System

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![AWS S3](https://img.shields.io/badge/AWS-S3-569A31?style=flat&logo=amazon-s3&logoColor=white)](https://aws.amazon.com/s3/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-02042B?style=flat&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)

A modern, cloud-native **Gym Management & Automated Billing Platform** built with React, Node.js/Express, MySQL, Razorpay Payment Gateway, and AWS S3 cloud receipt storage. Designed with a clean, distraction-free minimalist interface supporting both **Dark and Light modes**.

---

## 🌟 Key Features

- **🏛️ Public Front Landing Page:** Showcase gym features, cloud architecture, and transparent multi-tier membership pricing.
- **🌓 Minimalist UI with Theme Switching:** Clean, distraction-free interface with instant **Dark & Light Mode** toggle stored in `localStorage`.
- **👥 Member Directory & Profiles:** Track active/inactive members, contact information, photos, and auto-generated member IDs (`GM-00001`).
- **📋 Membership Plans Catalogue:** Multi-tier pricing (Basic, Standard, Premium, Elite) with duration and custom perk lists.
- **⏱️ Daily Attendance Tracking:** 1-click check-ins and check-outs with automated presence logs.
- **💳 Razorpay Payment Gateway:** Server-side order generation, test checkout modal, and HMAC-SHA256 signature verification.
- **📄 Automated PDF Receipts:** Dynamic invoices generated on the server using **PDFKit**; saved to private **AWS S3** buckets (or local storage in development) and downloaded via secure **presigned URLs**.
- **🛡️ Role-Based Access Control:** Separate portals for **Gym Administrators** and **Members** secured with JSON Web Tokens (JWT).

---

## 🏗️ System Architecture

```
[ Browser / Client ] 
        │ (React 19 + Vite)
        ▼
[ Node.js / Express API ] 
   ├── Auth Controller (JWT + Bcrypt)
   ├── Razorpay Service (Orders API & Signature Verification)
   ├── PDFKit Service (Dynamic Receipt Invoices)
   └── AWS SDK v3 (Private S3 Upload & Presigned URLs)
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
[ MySQL 8 Database ]        [ Amazon S3 ]
(Users, Members, Plans,     (Private Cloud Receipt
 Attendance, Payments)       Archiving)
```

---

## 🧪 Demo Credentials

The database comes pre-seeded with the following demo accounts:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `demo@gmail.com` | `password` | Full access to stats, members, plans, attendance, payments |
| **Admin** | `admin@gymms.com` | `password` | Administrator access |
| **Member** | `rahul@example.com` | `password` | Member dashboard, pay membership fees, download receipts |
| **Member** | `priya@example.com` | `password` | Member portal & payment checkout |

---

## 🚀 Local Development Setup

### Prerequisites
1. **Node.js** (v18 or v20 LTS) & **npm**
2. **MySQL Server** (v8.0) running locally on port `3306` (or via Docker)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Gokul-Nishandh/GymMS.git
cd GymMS
```

---

### Step 2: Database Initialization

Open **MySQL Workbench** or your MySQL terminal:

#### Option A: Using MySQL Workbench
1. Open MySQL Workbench and connect to your local MySQL instance.
2. Go to **File ➔ Open SQL Script...** and select `database/schema.sql`.
3. Press **`Ctrl + Shift + Enter`** (or click the ⚡ Lightning bolt icon) to execute the entire schema.

#### Option B: Using Command Line
```powershell
# In PowerShell:
Get-Content "database\schema.sql" | mysql -u root -p

# In Command Prompt (cmd):
mysql -u root -p < database\schema.sql
```

---

### Step 3: Configure Backend Environment

Copy the example environment file inside `server/`:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your local database credentials:
```properties
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=gym_management
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=your_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

# Razorpay Test Keys (Free test keys from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=placeholder_secret
RAZORPAY_WEBHOOK_SECRET=webhook_secret

# Receipt Storage Mode ('local' or 's3')
RECEIPT_STORAGE=local
CLIENT_URL=http://localhost:5173
```

---

### Step 4: Install Dependencies

From the project root:
```bash
# Install both backend and frontend dependencies in one command:
npm run install:all
```

*(Or install individually: `cd server && npm install` and `cd client && npm install`)*

---

### Step 5: Start the Application

#### Terminal 1 — Backend API:
```bash
cd server
npm run dev
```
> Server will boot on `http://localhost:5000`  
> Live database diagnostics available at `http://localhost:5000/api/debug`

#### Terminal 2 — Frontend Client:
```bash
cd client
npm run dev
```
> Frontend will open on `http://localhost:5173`

---

## 📂 Project Structure

```
gym-management/
├── client/                     # React 19 Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Logo, Sidebar, ThemeToggle, Toast
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── pages/              # Landing, Login, Dashboard, Members, etc.
│   │   ├── services/           # Axios API Client with interceptors
│   │   ├── App.jsx             # Routes & Protected Layout
│   │   ├── index.css           # Minimalist Design System (Light/Dark tokens)
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js          # API proxy to port 5000
│
├── server/                     # Node.js / Express Backend
│   ├── config/
│   │   └── database.js         # MySQL2 pool with auto-initialization
│   ├── controllers/            # Auth, Members, Plans, Payments, Receipts
│   ├── middleware/             # JWT authMiddleware, adminMiddleware
│   ├── routes/                 # REST API route handlers
│   ├── services/               # Razorpay, S3, PDFKit receipt generation
│   ├── app.js                  # Express app & graceful shutdown handlers
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── schema.sql              # Complete DDL schema & pre-seeded demo records
│
├── .gitignore                  # Production-ready gitignore
├── package.json                # Root convenience scripts
└── README.md                   # Documentation
```

---

## ☁️ AWS Cloud Deployment Summary

This project is prepared for standard AWS multi-tier cloud deployment:

1. **VPC Architecture:** Custom VPC with 1 public subnet (EC2, Nginx) and 2 private subnets across 2 Availability Zones for Amazon RDS.
2. **Amazon RDS MySQL:** Hosted in private subnets with DB Subnet Groups; inbound MySQL traffic allowed strictly from the EC2 security group.
3. **Amazon S3:** Private bucket for PDF receipts. EC2 instances access S3 via an IAM Instance Profile (no hardcoded keys in production).
4. **EC2 Instance:** Ubuntu 22.04/24.04 LTS running Nginx (as a reverse proxy serving the React `/dist` bundle) and PM2 running the Express API.
5. **Razorpay Webhooks:** Configured on the live EC2 public URL / custom domain to capture asynchronous payment confirmations.

---

## 📄 License
This project is licensed under the MIT License.

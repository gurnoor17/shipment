# Danodia FreightOS 🚢

Danodia FreightOS is a comprehensive, full-stack logistics and shipment management platform built to streamline the tracking of global freight movements, cargo metrics, and operational analytics.

## 💻 Tech Stack

This project is built using a modern, scalable JavaScript ecosystem:

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router & API Routes)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for strict type-safety
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for beautiful, responsive, and dynamic UI
- **Database**: [MongoDB](https://www.mongodb.com/) (Data modeling via [Mongoose](https://mongoosejs.com/))
- **Authentication**: Custom JWT (JSON Web Tokens) Implementation using `jose` & `bcryptjs` via Secure `HttpOnly` Cookies
- **Data Visualization**: [Recharts](https://recharts.org/) for interactive dashboard analytics

---

## ✨ Core Features & Capabilities

### 🔐 1. Secure Authentication System
- **Registration & Login**: Custom credentials-based authentication.
- **Session Management**: JWTs securely stored in HttpOnly cookies to prevent XSS attacks.
- **Route Protection**: Custom Next.js Middleware (`proxy.ts`) ensures the dashboard and API routes are strictly inaccessible without a valid session.

### 📦 2. Shipment Lifecycle Management
- **Full CRUD Operations**: Create, Read, Update, and Delete shipments instantly.
- **Logistics Timeline**: Track specific dates for *Pickup*, *Sailing*, *Expected ETA*, and *Actual Arrival*.
- **Granular Cargo Metrics**: Log *Container Numbers*, *FBA IDs*, *Weight (kg)*, *Volume (CBM)*, and *Box Counts*.
- **Document Attachments**: Upload and bind files (Invoices, Bill of Lading, Packing Lists) directly to specific shipment records.

### 📊 3. Analytics & Reporting
- **Real-time Summaries**: Live calculations of total volume, weight, and box counts based on current filters.
- **Global Distribution**: Interactive Pie Charts breaking down active shipments by geographical regions (USA, UK, Germany, etc).
- **Chronological Timelines**: Monthly performance Line Charts mapping historical shipment volume.

### 🔍 4. Productivity & Workflows
- **Dynamic Filtering**: Filter data instantly by Status (In Transit vs Delivered) or Region.
- **Fuzzy Search**: Instantly locate shipments via Invoice Number or FBA ID.
- **Saved Watchlist**: "Star" highly important shipments to pin them to a dedicated quick-access watchlist.
- **CSV Exporting**: Click a single button to dump the currently filtered view into a perfectly formatted CSV for Excel/Sheets.

### 👤 5. Profile Management
- **Dedicated Profile UI**: View active session credentials, account creation timelines, and workspace configurations dynamically fetched from the database.

---

## 📂 Project Architecture

```text
shipment-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Backend API Routes
│   │   │   ├── auth/           # Login, Register, Logout, Me endpoints
│   │   │   ├── shipments/      # Shipment CRUD endpoints
│   │   │   └── profile/        # Profile configuration endpoints
│   │   ├── login/              # Login Page UI
│   │   ├── register/           # Registration Page UI
│   │   ├── profile/            # Dedicated Profile Page UI
│   │   ├── layout.tsx          # Global HTML Shell & Fonts
│   │   ├── page.tsx            # The Core Dashboard (SPA Interface)
│   │   └── globals.css         # Tailwind directives & custom CSS
│   │
│   ├── lib/                    # Core Utilities
│   │   ├── mongodb.ts          # DB Connection Singleton
│   │   └── auth.ts             # JWT Verification & Password Hashing
│   │
│   ├── models/                 # Mongoose Database Schemas
│   │   ├── User.ts             # User Accounts
│   │   ├── Shipment.ts         # Freight Records
│   │   └── Profile.ts          # Workspace Settings
│   │
│   └── proxy.ts                # Edge Middleware for Route Protection
│
├── .env.local                  # Environment variables (Mongo URI, JWT Secret)
├── tailwind.config.ts          # Tailwind configuration
└── package.json                # Project dependencies
```

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Ensure your `.env.local` file contains:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=a_very_secure_random_string
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:3000`.*

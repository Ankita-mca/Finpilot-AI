# FinPilot AI — Node.js & Express.js Backend

Autonomous Cashflow Engine for Indian MSMEs  
**Stack**: Node.js 22 · Express.js · MongoDB Atlas (Mongoose) · JWT · bcryptjs

---

## 1. Architecture Overview

This backend replaces the previous Django prototype with an enterprise-ready, multi-tenant Node.js + Express backend powered by MongoDB Atlas.

### Key Architectural Tenets:
1. **Multi-Tenant Isolation**: Every business entity is partitioned by `orgId`. Middleware automatically extracts and enforces organization boundaries on every database operation.
2. **Role-Based Access Control (RBAC)**: Backend-enforced permissions for five distinct roles:
   - `Admin`: Full organization and member administration.
   - `CFO`: High-level financial reporting, reconciliation approval, and forecasting.
   - `CA`: Tax audit, invoice review, and financial compliance.
   - `Billing Operator`: Daily operations, invoice creation, and payment recording.
   - `Viewer`: Strict read-only view of dashboards and records.
3. **Strictly Read-Only AI Assistant**: The AI Assistant module communicates only through read-only aggregation queries. It has zero mutation (insert/update/delete) capabilities.
4. **INR Financial Integrity**: High-precision monetary calculations for Indian GST compliance (CGST, SGST, IGST), Days Sales Outstanding (DSO), and aging buckets.

---

## 2. Directory Layout

```
backend/
├── src/
│   ├── config/             # Database connection & environment configuration
│   ├── middleware/         # Auth, Tenant isolation, RBAC, Validation & Error handling
│   ├── models/             # Mongoose schemas (Users, Orgs, Invoices, Payments, etc.)
│   ├── controllers/        # Express route controllers & business logic
│   ├── routes/             # RESTful API route definitions
│   ├── services/           # GST calculation, Excel/CSV parsers, Analytics services
│   ├── utils/              # Helper utilities, constants, seed data
│   ├── app.js              # Express app configuration & middleware chain
│   └── server.js           # Server bootstrap & graceful shutdown
├── .env.example            # Environment variables template
├── .env                    # Active local environment settings
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

---

## 3. Step-by-Step Module Roadmap

We will develop and test each module iteratively:

- [x] **Step 1: Clean Foundation & Structure**:
  - Full removal of old Django/Python/SQLite artifacts.
  - Express application setup with Helmet, CORS, centralized error handling.
  - Mongoose MongoDB Atlas connection manager.
- [ ] **Step 2: Authentication & Multi-Tenancy Foundation**:
  - `User`, `Organization`, and `OrganizationMember` Mongoose models.
  - JWT generation, password hashing (`bcryptjs`), and refresh tokens.
  - `auth` and `tenant` middleware with RBAC enforcement.
- [ ] **Step 3: Customers & Invoicing Module**:
  - `Customer`, `Invoice`, and `InvoiceItem` models.
  - Indian GST calculations (CGST, SGST, IGST), due date checks, and automatic overdue status.
- [ ] **Step 4: Payments & Bank Reconciliation**:
  - `Payment`, `PaymentAllocation`, `BankTransaction`, and `PaymentReconciliation`.
  - Partial and full payment tracking, cross-organization safeguards.
  - CSV/Excel statement imports via `multer` and `xlsx`.
- [ ] **Step 5: Follow-Up Reminders & Cash Flow Forecasts**:
  - `PaymentReminder` (WhatsApp/Email simulation, UPI links).
  - `CashFlowForecast` (predicted inflows and outflows).
- [ ] **Step 6: Read-Only AI Assistant & Notifications**:
  - `AISession` and `AIQuery` models.
  - Strictly read-only aggregation analytics service.
  - In-app notification center & immutable audit logging.


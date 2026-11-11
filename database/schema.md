# FinPilot AI — Database Architecture

> **Stack:** PostgreSQL 15+ · Django ORM · Multi-tenant · INR-native financials  
> **Version:** 1.0 | All monetary values stored as `DECIMAL(15,2)` in Indian Rupees (INR)

---

## Table of Contents

1. [Why PostgreSQL?](#why-postgresql)
2. [Schema Overview](#schema-overview)
3. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
4. [Financial Accuracy](#financial-accuracy)
5. [AI Assistant Data Access](#ai-assistant-data-access)
6. [Key Indexes](#key-indexes)
7. [Entity Relationship Diagram](#entity-relationship-diagram)
8. [Django Integration](#django-integration)
9. [Setup Commands](#setup-commands)

---

## Why PostgreSQL?

PostgreSQL is the right choice for FinPilot AI for several concrete reasons:

**ACID Compliance**  
Every payment allocation, invoice update, and bank reconciliation runs inside a fully ACID-compliant transaction. A partial payment that touches `payments`, `payment_allocations`, and `invoices` either commits completely or rolls back — no half-written financial records.

**DECIMAL Precision**  
PostgreSQL's `DECIMAL(15,2)` type stores exact fixed-point values with no floating-point rounding errors. This is non-negotiable for financial data — a ₹1,00,000 invoice must never become ₹99,999.99 due to IEEE 754 approximation.

**JSONB for Flexible Metadata**  
Subscription plan features, org settings, AI query entities, and audit log diffs are all stored as `JSONB`. PostgreSQL's binary JSON format supports indexing, containment queries (`@>`), and partial updates without schema migrations for every new attribute.

**Django ORM Support**  
Django ships first-class support for PostgreSQL including `JSONField`, `ArrayField`, `GenericIPAddressField`, UUID primary keys, and partial indexes. The `psycopg2` / `psycopg3` adapter is battle-tested and handles connection pooling, prepared statements, and async queries.

**Row-Level Security (RLS)**  
PostgreSQL supports RLS policies that can enforce `org_id` isolation at the database engine level — a second line of defence beyond application-layer `WHERE org_id = ?` filters. If an application bug forgets the org filter, the database blocks cross-tenant reads.

---

## Schema Overview

| # | Table | Purpose | Rows (est.) | Key Relations |
|---|-------|---------|-------------|---------------|
| 1 | `subscription_plans` | Tier definitions (Free → Enterprise) | ~10 | → `organizations` |
| 2 | `organizations` | Tenant root — every business using FinPilot | 100s–10,000s | → `subscription_plans` |
| 3 | `users` | Individual user accounts | 1,000s–100,000s | → `organization_members` |
| 4 | `organization_members` | Many-to-many: users ↔ orgs with roles | ~3× users | → `organizations`, `users` |
| 5 | `customers` | Debtors / buyers of an org | 50–5,000 per org | → `organizations` |
| 6 | `invoices` | Core AR document with GST breakdown | 100s–100,000s per org | → `customers`, `organizations` |
| 7 | `invoice_items` | Line items per invoice | ~5× invoices | → `invoices` |
| 8 | `payments` | Incoming payment receipts | ~1× invoices | → `customers`, `organizations` |
| 9 | `payment_allocations` | Maps payments to invoices (many-to-many) | ~1.2× payments | → `payments`, `invoices` |
| 10 | `bank_transactions` | Raw bank statement rows | 10s–1,000s/month per org | → `organizations` |
| 11 | `payment_reconciliations` | Confirmed match: bank txn ↔ payment | ~1× bank_transactions | → `bank_transactions`, `payments` |
| 12 | `payment_reminders` | Scheduled / sent reminder events | ~3× invoices | → `invoices`, `customers` |
| 13 | `reminder_history` | Delivery status events per reminder | ~3× reminders | → `payment_reminders` |
| 14 | `cash_flow_forecasts` | AI-generated inflow/outflow predictions | 1–4/day per org | → `organizations` |
| 15 | `ai_sessions` | Conversation session container | ~daily per active user | → `users`, `organizations` |
| 16 | `ai_queries` | Individual NL queries + generated SQL | ~10× sessions | → `ai_sessions` |
| 17 | `notifications` | In-app alerts (overdue, payment, etc.) | ~daily per user | → `users`, `organizations` |
| 18 | `audit_logs` | Immutable change trail (BIGSERIAL) | ~50× all write ops | → `organizations`, `users` |
| 19 | `user_sessions` | JWT / refresh token registry | ~2× users | → `users`, `organizations` |

**Views (read-only for AI)**

| View | Purpose |
|------|---------|
| `v_customer_outstanding` | Aggregated open balance + overdue per customer |
| `v_invoice_aging` | Aging buckets: current, 1-7d, 8-15d, 16-30d, 31-60d, 60d+ |

---

## Multi-Tenancy Strategy

FinPilot AI uses a **shared schema, shared database** multi-tenancy model — a single PostgreSQL instance serves all organizations, with strict data isolation enforced at every layer.

### The `org_id` Contract

Every business table carries an `org_id UUID NOT NULL` foreign key pointing to `organizations`. This is the primary isolation boundary:

```sql
-- Every query from the API layer includes this filter
SELECT * FROM invoices WHERE org_id = $1 AND ...
```

No query should ever return data for an org other than the authenticated user's org. The `org_id` column is indexed on every table to make these filters cheap at scale.

### Enforcement Layers

1. **Application layer** — Django views and serializers always scope querysets with `.filter(org=request.org)`. No unscoped queries reach production routes.

2. **Database layer** — PostgreSQL Row-Level Security can be activated on sensitive tables:
   ```sql
   ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
   CREATE POLICY org_isolation ON invoices
       USING (org_id = current_setting('app.current_org_id')::uuid);
   ```
   This means even a raw SQL prompt injected through a bug can't read another org's data.

3. **Unique constraints** — Many constraints are scoped per-org, e.g. `UNIQUE (org_id, invoice_number)` and `UNIQUE (org_id, gstin)` on customers. An invoice number like `INV-001` can exist for multiple orgs without collision.

### Organization Membership

`organization_members` is the bridge table. A user can belong to multiple organizations with different roles (`owner`, `admin`, `accountant`, `viewer`) and granular JSON permissions per org. The active org is determined at login and stored in the JWT claims.

---

## Financial Accuracy

Financial software cannot tolerate approximations. FinPilot AI enforces accuracy at multiple levels.

### DECIMAL(15,2) Throughout

Every monetary column uses `DECIMAL(15,2)` — exact fixed-point arithmetic, not floating point. This supports values up to ₹9,99,99,99,99,99,999.99, covering any realistic Indian business transaction.

```sql
-- Example: DECIMAL(15,2) means exact representation
total_inr       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
paid_amount_inr DECIMAL(15,2) NOT NULL DEFAULT 0.00,
outstanding_inr DECIMAL(15,2) NOT NULL DEFAULT 0.00,
```

### Automatic Outstanding Calculation via Trigger

A PostgreSQL trigger (`trg_invoice_update`) fires on every `INSERT` or `UPDATE` to `invoices`. It automatically recomputes `outstanding_inr = total_inr - paid_amount_inr` and transitions the status to `'overdue'` when the due date has passed:

```sql
CREATE OR REPLACE FUNCTION fn_invoice_update()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.outstanding_inr := NEW.total_inr - NEW.paid_amount_inr;
    IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('sent','partial') THEN
        NEW.status := 'overdue';
    END IF;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;
```

The Django model's `save()` method mirrors this logic in Python so the in-memory object stays consistent before the DB round-trip.

### CHECK Constraints

Critical financial invariants are enforced by the database, not just application code:

```sql
-- Payments must be positive
amount_inr DECIMAL(15,2) NOT NULL CHECK (amount_inr > 0)

-- Payment allocations must be positive
allocated_inr DECIMAL(15,2) NOT NULL CHECK (allocated_inr > 0)

-- Risk score must be 0–100
risk_score SMALLINT CHECK (risk_score BETWEEN 0 AND 100)
```

### GST Breakdown Stored Separately

Each invoice and line item stores CGST, SGST, and IGST independently. This supports:
- Intra-state sales: CGST + SGST (each 9% for 18% GST)
- Inter-state sales: IGST only (18%)
- Zero-rated and exempt items

The breakdown is stored rather than calculated on-the-fly so historical invoices remain accurate even if tax rates change.

---

## AI Assistant Data Access

The FinPilot AI assistant answers natural language questions about receivables. Here's the data mapping for each query type:

| User Question | Intent | Primary Table / View | Key Columns |
|--------------|--------|---------------------|-------------|
| "What's my total outstanding?" | `outstanding_balance` | `v_customer_outstanding` | `total_outstanding_inr` aggregated by `org_id` |
| "Which invoices are overdue?" | `overdue_list` | `v_invoice_aging` | `aging_bucket`, `days_overdue`, `outstanding_inr` |
| "Show me overdue invoices older than 30 days" | `overdue_list` | `v_invoice_aging` | `WHERE aging_bucket IN ('31-60d','60d+')` |
| "What did Acme Corp pay last month?" | `payment_history` | `payments` + `customers` | `payment_date`, `amount_inr`, `payment_mode` |
| "How much does Tata Chemicals owe me?" | `customer_dues` | `v_customer_outstanding` | `total_outstanding_inr WHERE customer_name = ?` |
| "What's my expected cash inflow this month?" | `cash_flow` | `cash_flow_forecasts` | `expected_inflow_inr WHERE horizon = '30d'` |
| "What's the status of invoice INV-2024-089?" | `invoice_status` | `invoices` | `status`, `outstanding_inr`, `due_date` |
| "Who hasn't paid in 60+ days?" | `overdue_list` | `v_invoice_aging` | `WHERE aging_bucket = '60d+'` |
| "Show me top 5 customers by outstanding amount" | `customer_dues` | `v_customer_outstanding` | `ORDER BY total_outstanding_inr DESC LIMIT 5` |
| "How many reminders were sent this week?" | `general` | `payment_reminders` | `COUNT(*) WHERE sent_at >= NOW()-'7 days'` |
| "What's my collection efficiency?" | `cash_flow` | `invoices` + `payments` | Ratio of `paid_amount_inr` / `total_inr` |

Every AI query is logged to `ai_queries` with the original text, the inferred intent, extracted entities, and the SQL generated — enabling accuracy feedback, improvement loops, and usage metering against the plan's `ai_queries_day` limit.

---

## Key Indexes

### Tenant Isolation Indexes

```sql
-- All reads start with org_id; these indexes make them O(log n) per org
CREATE INDEX idx_invoices_org      ON invoices(org_id);
CREATE INDEX idx_customers_org     ON customers(org_id);
CREATE INDEX idx_payments_org      ON payments(org_id);
CREATE INDEX idx_bank_txn_org      ON bank_transactions(org_id);
CREATE INDEX idx_reminders_org     ON payment_reminders(org_id);
```

| Index | Why it matters |
|-------|----------------|
| `idx_invoices_org` | Every invoice list, dashboard, and AI query filters by `org_id` first |
| `idx_customers_org` | Customer lookups always scoped to the org |
| `idx_payments_org` | Payment history and reconciliation reads |

### Composite Indexes for Common Queries

```sql
-- Dashboard: "show me all overdue invoices for this org"
CREATE INDEX idx_invoices_status ON invoices(org_id, status);

-- Aging report: "invoices due before today"
CREATE INDEX idx_invoices_due ON invoices(due_date);

-- Customer search by name within org
CREATE INDEX idx_customers_name ON customers(org_id, name);

-- Reminders scheduler: "what's pending right now?"
CREATE INDEX idx_reminders_status ON payment_reminders(org_id, status);
```

### Unique / Lookup Indexes

```sql
-- Auth: token lookup on every API request (must be sub-millisecond)
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);

-- Payment matching: UTR-based bank reconciliation
CREATE INDEX idx_payments_utr   ON payments(utr_number);
CREATE INDEX idx_bank_txn_utr   ON bank_transactions(utr);

-- GSTIN lookup for customer deduplication
CREATE INDEX idx_customers_gstin ON customers(org_id, gstin);
```

### Audit Log Index

```sql
-- Audit trail queries always filter by org and sort by newest first
CREATE INDEX idx_audit_org ON audit_logs(org_id, created_at DESC);
```

This is a descending index on `created_at`, matching the natural query pattern (`ORDER BY created_at DESC LIMIT 50`) without a sort step.

---

## Entity Relationship Diagram

```
subscription_plans
    │ id (PK)
    │ name, price_inr, max_users ...
    │
    └──< organizations
             │ id (UUID PK)
             │ name, gstin, email, settings ...
             │ plan_id ──────────────────────────► subscription_plans
             │
             ├──< organization_members
             │         org_id ──► organizations
             │         user_id ──► users
             │         role, permissions
             │
             ├──< customers
             │         id (UUID PK)
             │         org_id ──► organizations
             │         name, gstin, credit_terms_days
             │         risk_score, upi_id
             │         │
             │         ├──< invoices
             │         │         id (UUID PK)
             │         │         org_id ──► organizations
             │         │         customer_id ──► customers
             │         │         invoice_number, due_date, status
             │         │         total_inr, outstanding_inr
             │         │         [TRIGGER: auto-computes outstanding_inr]
             │         │         [TRIGGER: auto-sets status=overdue]
             │         │         │
             │         │         ├──< invoice_items
             │         │         │         invoice_id ──► invoices
             │         │         │         description, quantity
             │         │         │         unit_price_inr, gst_rate_pct
             │         │         │         cgst_inr, sgst_inr, igst_inr
             │         │         │         line_total_inr
             │         │         │
             │         │         ├──< payment_allocations
             │         │         │         payment_id ──► payments
             │         │         │         invoice_id ──► invoices
             │         │         │         allocated_inr
             │         │         │
             │         │         └──< payment_reminders
             │         │                   invoice_id ──► invoices
             │         │                   customer_id ──► customers
             │         │                   reminder_type, status
             │         │                   scheduled_at, sent_at
             │         │                   │
             │         │                   └──< reminder_history
             │         │                             reminder_id ──► payment_reminders
             │         │                             event_type, channel, external_ref
             │         │
             │         └──< payments
             │                   id (UUID PK)
             │                   org_id ──► organizations
             │                   customer_id ──► customers
             │                   amount_inr, payment_mode, utr_number
             │                   status, unallocated_inr
             │                   │
             │                   └──< payment_reconciliations
             │                             bank_txn_id ──► bank_transactions
             │                             payment_id ──► payments
             │                             matched_amount_inr, confidence_score
             │
             ├──< bank_transactions
             │         id (UUID PK)
             │         org_id ──► organizations
             │         transaction_date, description
             │         debit_inr, credit_inr, utr
             │         reconcile_status
             │         matched_payment_id ──► payments
             │
             ├──< cash_flow_forecasts
             │         org_id ──► organizations
             │         forecast_date, horizon
             │         expected_inflow_inr, net_flow_inr
             │         confidence_score, model_version
             │
             ├──< ai_sessions
             │         org_id ──► organizations
             │         user_id ──► users
             │         total_queries, model_used
             │         │
             │         └──< ai_queries
             │                   session_id ──► ai_sessions
             │                   query_text, intent, entities
             │                   sql_generated, response_text
             │                   tokens_used, latency_ms
             │
             ├──< notifications
             │         org_id ──► organizations
             │         user_id ──► users
             │         type, title, priority, is_read
             │
             └──< audit_logs
                       org_id ──► organizations
                       user_id ──► users
                       action, entity_type, entity_id
                       old_values (JSONB), new_values (JSONB)

users
    │ id (UUID PK)
    │ email (UNIQUE), password_hash
    │ first_name, last_name
    │ two_fa_enabled, email_verified
    │
    └──< user_sessions
              user_id ──► users
              org_id ──► organizations
              token_hash (UNIQUE), refresh_token
              expires_at, is_active, last_used_at

─────────────────────────────────────────────────────────────
VIEWS (read-only, used by AI assistant)
─────────────────────────────────────────────────────────────

v_customer_outstanding
    Aggregates: customers + invoices(sent/partial/overdue) + payments
    Output: total_outstanding_inr, overdue_inr, open_invoice_count
            earliest_due_date, last_payment_date per customer

v_invoice_aging
    Joins: invoices + customers
    Output: days_overdue, aging_bucket per open invoice
    Buckets: current | 1-7d | 8-15d | 16-30d | 31-60d | 60d+
```

---

## Django Integration

### `settings.py` — Database Configuration

```python
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     'finpilot',
        'USER':     'finpilot_user',
        'PASSWORD': 'your-secure-password',   # use env var in production
        'HOST':     'localhost',
        'PORT':     '5432',
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',   # 30s query timeout
        },
        'CONN_MAX_AGE': 60,   # persistent connections
    }
}
```

For production, load credentials from environment variables:

```python
import os

DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     os.environ['DB_NAME'],
        'USER':     os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST':     os.environ['DB_HOST'],
        'PORT':     os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', 60)),
    }
}
```

### Required Installed App

```python
INSTALLED_APPS = [
    ...
    'django.contrib.postgres',   # enables JSONField, ArrayField, etc.
    'finpilot.core',             # app containing models.py
]
```

### Migrations

```bash
# Create initial migration from models.py
python manage.py makemigrations core

# Apply migrations to the database
python manage.py migrate

# Check migration status
python manage.py showmigrations

# Generate SQL preview without applying
python manage.py sqlmigrate core 0001
```

> **Note:** The `schema.sql` file is the canonical source of truth for the PostgreSQL schema. The Django models in `models.py` mirror it exactly. If you use Django migrations exclusively, you do not need to run `schema.sql` directly. If you prefer to manage DDL manually via `schema.sql`, set `managed = False` on each model's `Meta` class.

---

## Setup Commands

### 1. Create the Database

```bash
# Connect as postgres superuser
psql -U postgres

# Create dedicated user and database
CREATE USER finpilot_user WITH PASSWORD 'your-secure-password';
CREATE DATABASE finpilot OWNER finpilot_user;
GRANT ALL PRIVILEGES ON DATABASE finpilot TO finpilot_user;

# Exit
\q
```

### 2. Run the Schema

```bash
# Apply schema.sql to create all tables, indexes, triggers, views, and seed data
psql -U finpilot_user -d finpilot -f backend/db/schema.sql
```

### 3. Verify the Schema

```bash
psql -U finpilot_user -d finpilot

# List all tables
\dt

# Describe a specific table
\d invoices

# List all indexes
\di

# List all views
\dv

# Test a view
SELECT * FROM v_customer_outstanding LIMIT 5;
SELECT * FROM v_invoice_aging LIMIT 10;

# Check seed data
SELECT * FROM subscription_plans;
```

### 4. Install Python Dependencies

```bash
pip install django psycopg2-binary
# or for async support:
pip install django psycopg[binary]
```

### 5. Run Django Migrations (if using ORM migrations instead of schema.sql)

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 6. Enable pgcrypto Extension (if not already present)

```sql
-- Run as superuser if the extension isn't auto-created by schema.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Production Checklist

- [ ] Store DB credentials in environment variables, never in source code
- [ ] Enable SSL: add `'sslmode': 'require'` to `DATABASES['default']['OPTIONS']`
- [ ] Set up connection pooling with PgBouncer for > 50 concurrent users
- [ ] Configure automated daily backups with `pg_dump`
- [ ] Set `statement_timeout` to prevent runaway queries
- [ ] Enable Row-Level Security policies for additional tenant isolation
- [ ] Create read replica for AI query workloads to offload the primary
- [ ] Monitor slow queries via `pg_stat_statements` extension

-- ============================================================
-- FinPilot AI -- PostgreSQL Database Schema v1.1
-- PostgreSQL 15+ | Supabase Compatible
-- All monetary values: DECIMAL(15,2) INR
-- Multi-tenant: org_id on every business table
--
-- CHANGELOG v1.1:
--   - Fixed v_customer_outstanding: now uses subqueries to prevent
--     duplicate SUM values when customer has multiple invoices + payments
--   - Added cross-org protection trigger on payment_allocations
--   - Users table renamed comment added for Django compatibility
--   - No destructive commands (no DROP, TRUNCATE, DELETE)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE 1: subscription_plans
-- ============================================================
CREATE TABLE subscription_plans (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    max_users           INT NOT NULL DEFAULT 5,
    max_customers       INT NOT NULL DEFAULT 50,
    max_invoices_month  INT NOT NULL DEFAULT 100,
    ai_queries_day      INT NOT NULL DEFAULT 50,
    price_inr           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    features            JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: organizations
-- ============================================================
CREATE TABLE organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    legal_name          VARCHAR(255),
    gstin               VARCHAR(15) UNIQUE,
    pan                 VARCHAR(10),
    business_type       VARCHAR(50),
    industry            VARCHAR(100),
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100) NOT NULL DEFAULT 'India',
    website             VARCHAR(255),
    phone               VARCHAR(20),
    email               VARCHAR(255) NOT NULL,
    logo_url            VARCHAR(500),
    address             TEXT,
    pincode             VARCHAR(10),
    plan_id             INT REFERENCES subscription_plans(id),
    plan_expires_at     TIMESTAMPTZ,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    tally_connected     BOOLEAN NOT NULL DEFAULT FALSE,
    zoho_connected      BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync_at        TIMESTAMPTZ,
    settings            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orgs_gstin ON organizations(gstin);
CREATE INDEX idx_orgs_plan  ON organizations(plan_id);

-- ============================================================
-- TABLE 3: users
-- NOTE: This is FinPilot's own user table (separate from Django's
--       auth_user table). Django models use db_table='users' and
--       managed=False so migrations do not touch this table.
-- ============================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(20),
    avatar_url          VARCHAR(500),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_superuser        BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    two_fa_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_secret       VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TABLE 4: organization_members
-- ============================================================
CREATE TABLE organization_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(30) NOT NULL DEFAULT 'viewer',
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_by  UUID REFERENCES users(id),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (org_id, user_id)
);
CREATE INDEX idx_org_members_org  ON organization_members(org_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ============================================================
-- TABLE 5: customers
-- ============================================================
CREATE TABLE customers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    legal_name          VARCHAR(255),
    gstin               VARCHAR(15),
    pan                 VARCHAR(10),
    email               VARCHAR(255),
    phone               VARCHAR(20),
    contact_person      VARCHAR(100),
    business_type       VARCHAR(50),
    industry_vertical   VARCHAR(100),
    credit_terms_days   INT NOT NULL DEFAULT 30,
    credit_limit_inr    DECIMAL(15,2),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    country             VARCHAR(100) NOT NULL DEFAULT 'India',
    bank_account_no     VARCHAR(30),
    bank_ifsc           VARCHAR(11),
    bank_name           VARCHAR(100),
    upi_id              VARCHAR(100),
    notes               TEXT,
    tags                TEXT[],
    risk_score          SMALLINT CHECK (risk_score BETWEEN 0 AND 100),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, gstin)
);
CREATE INDEX idx_customers_org   ON customers(org_id);
CREATE INDEX idx_customers_name  ON customers(org_id, name);
CREATE INDEX idx_customers_gstin ON customers(org_id, gstin);

-- ============================================================
-- TABLE 6: invoices
-- ============================================================
CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_number      VARCHAR(50) NOT NULL,
    invoice_date        DATE NOT NULL,
    due_date            DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft',
    subtotal_inr        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_inr        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_pct        DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    taxable_amount_inr  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    cgst_inr            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    sgst_inr            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    igst_inr            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_tax_inr       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_inr           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    paid_amount_inr     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    outstanding_inr     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency            CHAR(3) NOT NULL DEFAULT 'INR',
    po_number           VARCHAR(100),
    irn                 VARCHAR(100),
    eway_bill_no        VARCHAR(50),
    payment_terms       TEXT,
    notes               TEXT,
    internal_notes      TEXT,
    sent_at             TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_by          UUID REFERENCES users(id),
    updated_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, invoice_number)
);
CREATE INDEX idx_invoices_org      ON invoices(org_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status   ON invoices(org_id, status);
CREATE INDEX idx_invoices_due      ON invoices(due_date);
CREATE INDEX idx_invoices_number   ON invoices(org_id, invoice_number);

-- Trigger: auto-compute outstanding_inr and set overdue status
CREATE OR REPLACE FUNCTION fn_invoice_update()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.outstanding_inr := NEW.total_inr - NEW.paid_amount_inr;
    IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('sent', 'partial') THEN
        NEW.status := 'overdue';
    END IF;
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_update
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION fn_invoice_update();

-- ============================================================
-- TABLE 7: invoice_items
-- ============================================================
CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    description     TEXT NOT NULL,
    hsn_sac_code    VARCHAR(20),
    quantity        DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit            VARCHAR(30),
    unit_price_inr  DECIMAL(15,2) NOT NULL,
    discount_pct    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    discount_inr    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    taxable_inr     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    gst_rate_pct    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    cgst_pct        DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    sgst_pct        DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    igst_pct        DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    cgst_inr        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    sgst_inr        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    igst_inr        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    line_total_inr  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_org     ON invoice_items(org_id);

-- ============================================================
-- TABLE 8: payments
-- ============================================================
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    payment_date    DATE NOT NULL,
    amount_inr      DECIMAL(15,2) NOT NULL CHECK (amount_inr > 0),
    payment_mode    VARCHAR(30) NOT NULL,
    utr_number      VARCHAR(50),
    upi_ref         VARCHAR(100),
    cheque_number   VARCHAR(30),
    cheque_date     DATE,
    bank_ref        VARCHAR(100),
    bank_name       VARCHAR(100),
    notes           TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'cleared',
    unallocated_inr DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_org      ON payments(org_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date     ON payments(payment_date);
CREATE INDEX idx_payments_utr      ON payments(utr_number);

-- ============================================================
-- TABLE 9: payment_allocations
-- FIXED: Added cross-org protection trigger (see below)
-- ============================================================
CREATE TABLE payment_allocations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    allocated_inr   DECIMAL(15,2) NOT NULL CHECK (allocated_inr > 0),
    allocated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    allocated_by    UUID REFERENCES users(id),
    notes           TEXT,
    UNIQUE (payment_id, invoice_id)
);
CREATE INDEX idx_alloc_payment ON payment_allocations(payment_id);
CREATE INDEX idx_alloc_invoice ON payment_allocations(invoice_id);
CREATE INDEX idx_alloc_org     ON payment_allocations(org_id);

-- Cross-org protection: payment and invoice must belong to same org
CREATE OR REPLACE FUNCTION fn_check_allocation_org()
RETURNS TRIGGER AS $func$
DECLARE
    v_payment_org UUID;
    v_invoice_org UUID;
BEGIN
    SELECT org_id INTO v_payment_org FROM payments WHERE id = NEW.payment_id;
    SELECT org_id INTO v_invoice_org FROM invoices  WHERE id = NEW.invoice_id;

    IF v_payment_org IS DISTINCT FROM v_invoice_org THEN
        RAISE EXCEPTION
            'Cross-organization allocation blocked: payment org % != invoice org %',
            v_payment_org, v_invoice_org;
    END IF;

    -- Also ensure allocation org_id matches
    IF NEW.org_id IS DISTINCT FROM v_payment_org THEN
        RAISE EXCEPTION
            'Allocation org_id % does not match payment org_id %',
            NEW.org_id, v_payment_org;
    END IF;

    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_allocation_org
BEFORE INSERT OR UPDATE ON payment_allocations
FOR EACH ROW EXECUTE FUNCTION fn_check_allocation_org();

-- ============================================================
-- TABLE 10: bank_transactions
-- ============================================================
CREATE TABLE bank_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    transaction_date    DATE NOT NULL,
    value_date          DATE,
    description         TEXT NOT NULL,
    debit_inr           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    credit_inr          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance_inr         DECIMAL(15,2),
    utr                 VARCHAR(100),
    bank_ref            VARCHAR(100),
    bank_name           VARCHAR(100),
    reconcile_status    VARCHAR(20) NOT NULL DEFAULT 'unmatched',
    matched_payment_id  UUID REFERENCES payments(id),
    source              VARCHAR(30) NOT NULL DEFAULT 'manual',
    raw_data            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bank_txn_org       ON bank_transactions(org_id);
CREATE INDEX idx_bank_txn_date      ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_txn_reconcile ON bank_transactions(org_id, reconcile_status);
CREATE INDEX idx_bank_txn_utr       ON bank_transactions(utr);

-- ============================================================
-- TABLE 11: payment_reconciliations
-- ============================================================
CREATE TABLE payment_reconciliations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bank_txn_id         UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
    payment_id          UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    matched_amount_inr  DECIMAL(15,2) NOT NULL,
    match_type          VARCHAR(20) NOT NULL DEFAULT 'manual',
    confidence_score    DECIMAL(5,4),
    reconciled_by       UUID REFERENCES users(id),
    reconciled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes               TEXT,
    UNIQUE (bank_txn_id, payment_id)
);
CREATE INDEX idx_recon_org ON payment_reconciliations(org_id);

-- ============================================================
-- TABLE 12: payment_reminders
-- ============================================================
CREATE TABLE payment_reminders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id       UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reminder_type    VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    trigger_type     VARCHAR(20) NOT NULL DEFAULT 'manual',
    scheduled_at     TIMESTAMPTZ NOT NULL,
    sent_at          TIMESTAMPTZ,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending',
    message_template VARCHAR(50),
    message_body     TEXT,
    upi_link         VARCHAR(500),
    sent_by          UUID REFERENCES users(id),
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reminders_org      ON payment_reminders(org_id);
CREATE INDEX idx_reminders_invoice  ON payment_reminders(invoice_id);
CREATE INDEX idx_reminders_status   ON payment_reminders(org_id, status);
CREATE INDEX idx_reminders_schedule ON payment_reminders(scheduled_at);

-- ============================================================
-- TABLE 13: reminder_history
-- ============================================================
CREATE TABLE reminder_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id     UUID NOT NULL REFERENCES payment_reminders(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type      VARCHAR(30) NOT NULL,
    event_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    channel         VARCHAR(20),
    external_ref    VARCHAR(200),
    response_text   TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_reminder_hist_reminder ON reminder_history(reminder_id);
CREATE INDEX idx_reminder_hist_org      ON reminder_history(org_id);

-- ============================================================
-- TABLE 14: cash_flow_forecasts
-- ============================================================
CREATE TABLE cash_flow_forecasts (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    forecast_date         DATE NOT NULL,
    horizon               VARCHAR(20) NOT NULL,
    expected_inflow_inr   DECIMAL(15,2) NOT NULL,
    expected_outflow_inr  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    net_flow_inr          DECIMAL(15,2) NOT NULL,
    confidence_score      DECIMAL(5,4),
    basis_invoices_count  INT,
    basis_outstanding_inr DECIMAL(15,2),
    model_version         VARCHAR(30),
    input_snapshot        JSONB,
    forecast_breakdown    JSONB,
    actual_inflow_inr     DECIMAL(15,2),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_forecast_org  ON cash_flow_forecasts(org_id);
CREATE INDEX idx_forecast_date ON cash_flow_forecasts(org_id, forecast_date);

-- ============================================================
-- TABLE 15: ai_sessions
-- ============================================================
CREATE TABLE ai_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    total_queries   INT NOT NULL DEFAULT 0,
    model_used      VARCHAR(50),
    session_meta    JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_ai_sessions_org  ON ai_sessions(org_id);
CREATE INDEX idx_ai_sessions_user ON ai_sessions(user_id);

-- ============================================================
-- TABLE 16: ai_queries
-- ============================================================
CREATE TABLE ai_queries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query_text      TEXT NOT NULL,
    intent          VARCHAR(50),
    entities        JSONB DEFAULT '{}'::jsonb,
    sql_generated   TEXT,
    response_text   TEXT,
    response_data   JSONB,
    tokens_used     INT,
    latency_ms      INT,
    is_accurate     BOOLEAN,
    feedback_note   TEXT,
    queried_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_queries_session ON ai_queries(session_id);
CREATE INDEX idx_ai_queries_org     ON ai_queries(org_id);
CREATE INDEX idx_ai_queries_intent  ON ai_queries(org_id, intent);

-- ============================================================
-- TABLE 17: notifications
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    entity_type     VARCHAR(30),
    entity_id       UUID,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    priority        SMALLINT NOT NULL DEFAULT 2,
    action_url      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_org  ON notifications(org_id);
CREATE INDEX idx_notifications_type ON notifications(org_id, type);

-- ============================================================
-- TABLE 18: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_org    ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user   ON audit_logs(user_id);

-- ============================================================
-- TABLE 19: user_sessions
-- NOTE: Separate from Django's django_session table.
--       This stores JWT/refresh tokens for the FinPilot API.
-- ============================================================
CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    refresh_token   VARCHAR(255) UNIQUE,
    device_info     TEXT,
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_user  ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);

-- ============================================================
-- VIEWS FOR AI ASSISTANT (read-only)
-- ============================================================

-- FIXED v1.1: Uses subqueries to prevent row multiplication
-- when a customer has multiple invoices AND multiple payments.
-- Old version: JOIN invoices + payments directly = M x N rows = wrong SUM
-- New version: aggregate invoices and payments separately first
CREATE VIEW v_customer_outstanding AS
SELECT
    c.id                                AS customer_id,
    c.org_id,
    c.name                              AS customer_name,
    c.gstin,
    c.credit_terms_days,
    COALESCE(inv.open_invoice_count, 0) AS open_invoice_count,
    COALESCE(inv.total_outstanding_inr, 0) AS total_outstanding_inr,
    COALESCE(inv.overdue_inr, 0)        AS overdue_inr,
    inv.earliest_due_date,
    pmt.last_payment_date
FROM customers c

-- Subquery 1: aggregate open invoices per customer (no payment join here)
LEFT JOIN (
    SELECT
        customer_id,
        COUNT(*)                                            AS open_invoice_count,
        SUM(outstanding_inr)                                AS total_outstanding_inr,
        SUM(CASE WHEN status = 'overdue'
                 THEN outstanding_inr ELSE 0 END)           AS overdue_inr,
        MIN(due_date)                                       AS earliest_due_date
    FROM invoices
    WHERE status IN ('sent', 'partial', 'overdue')
    GROUP BY customer_id
) inv ON inv.customer_id = c.id

-- Subquery 2: most recent cleared payment per customer (no invoice join here)
LEFT JOIN (
    SELECT
        customer_id,
        MAX(payment_date)                                   AS last_payment_date
    FROM payments
    WHERE status = 'cleared'
    GROUP BY customer_id
) pmt ON pmt.customer_id = c.id;

-- v_invoice_aging: no changes needed, was already correct
CREATE VIEW v_invoice_aging AS
SELECT
    i.org_id,
    i.id                          AS invoice_id,
    i.invoice_number,
    i.customer_id,
    c.name                        AS customer_name,
    i.total_inr,
    i.outstanding_inr,
    i.due_date,
    i.status,
    CURRENT_DATE - i.due_date     AS days_overdue,
    CASE
        WHEN CURRENT_DATE - i.due_date <= 0  THEN 'current'
        WHEN CURRENT_DATE - i.due_date <= 7  THEN '1-7d'
        WHEN CURRENT_DATE - i.due_date <= 15 THEN '8-15d'
        WHEN CURRENT_DATE - i.due_date <= 30 THEN '16-30d'
        WHEN CURRENT_DATE - i.due_date <= 60 THEN '31-60d'
        ELSE '60d+'
    END                           AS aging_bucket
FROM invoices i
JOIN customers c ON c.id = i.customer_id
WHERE i.status IN ('sent', 'partial', 'overdue');

-- ============================================================
-- SEED DATA: Subscription Plans
-- ============================================================
INSERT INTO subscription_plans
    (name, max_users, max_customers, max_invoices_month, ai_queries_day, price_inr)
VALUES
    ('Free',        1,   10,   20,   10,    0.00),
    ('Starter',     3,   50,  100,   50,  999.00),
    ('Growth',     10,  200,  500,  200, 2499.00),
    ('Enterprise', 50, 1000, 5000, 1000, 7999.00);
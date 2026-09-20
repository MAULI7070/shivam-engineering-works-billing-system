-- ============================================================
-- Shivam Engineering Works — Billing System Database Schema
-- ============================================================

-- Drop existing tables (order matters due to FK)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- ============================================================
-- INVOICES TABLE
-- ============================================================
CREATE TABLE invoices (
    id               SERIAL PRIMARY KEY,

    -- Invoice Header
    invoice_no       VARCHAR(50)  NOT NULL UNIQUE,
    invoice_date     DATE         NOT NULL,
    transport_mode   VARCHAR(100) DEFAULT '',
    vehicle_number   VARCHAR(50)  DEFAULT '',
    reverse_charge   BOOLEAN      DEFAULT FALSE,
    date_of_supply   DATE,
    state            VARCHAR(100) DEFAULT 'MAHARASHTRA',
    state_code       VARCHAR(20)  DEFAULT '414111',
    place_of_supply  VARCHAR(200) DEFAULT '',

    -- Bill To (Customer)
    bill_name        VARCHAR(200) NOT NULL,
    bill_address     TEXT         DEFAULT '',
    bill_gstin       VARCHAR(20)  DEFAULT '',
    bill_state       VARCHAR(100) DEFAULT 'MAHARASHTRA',
    bill_state_code  VARCHAR(20)  DEFAULT '414111',

    -- Ship To (Party)
    ship_name        VARCHAR(200) DEFAULT '',
    ship_address     TEXT         DEFAULT '',
    ship_gstin       VARCHAR(20)  DEFAULT '',
    ship_state       VARCHAR(100) DEFAULT 'MAHARASHTRA',
    ship_state_code  VARCHAR(20)  DEFAULT '414111',

    -- Totals
    total_taxable    NUMERIC(12,2) DEFAULT 0,
    cgst_amount      NUMERIC(12,2) DEFAULT 0,
    sgst_amount      NUMERIC(12,2) DEFAULT 0,
    igst_amount      NUMERIC(12,2) DEFAULT 0,
    total_tax        NUMERIC(12,2) DEFAULT 0,
    total_after_tax  NUMERIC(12,2) DEFAULT 0,
    amount_in_words  TEXT          DEFAULT '',

    -- Bank Details
    bank_name        VARCHAR(200) DEFAULT 'G.S. Mahanagar Bank',
    bank_ac          VARCHAR(50)  DEFAULT '07701120000158',
    bank_ifsc        VARCHAR(20)  DEFAULT 'MCBL0960077',

    -- Metadata
    notes            TEXT         DEFAULT '',
    status           VARCHAR(20)  DEFAULT 'draft',  -- draft | submitted
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INVOICE ITEMS TABLE
-- ============================================================
CREATE TABLE invoice_items (
    id                SERIAL PRIMARY KEY,
    invoice_id        INTEGER      NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    sr_no             INTEGER      NOT NULL,
    product_description VARCHAR(500) NOT NULL,
    hsn_code          VARCHAR(50)  DEFAULT '',
    qty               NUMERIC(10,2) DEFAULT 0,
    rate              NUMERIC(12,2) DEFAULT 0,
    amount            NUMERIC(12,2) DEFAULT 0,
    discount          NUMERIC(12,2) DEFAULT 0,
    taxable_value     NUMERIC(12,2) DEFAULT 0,
    cgst_rate         NUMERIC(5,2)  DEFAULT 0,
    cgst_amount       NUMERIC(12,2) DEFAULT 0,
    sgst_rate         NUMERIC(5,2)  DEFAULT 0,
    sgst_amount       NUMERIC(12,2) DEFAULT 0,
    igst_rate         NUMERIC(5,2)  DEFAULT 0,
    igst_amount       NUMERIC(12,2) DEFAULT 0,
    total             NUMERIC(12,2) DEFAULT 0,

    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AUTO UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_invoices_invoice_no    ON invoices(invoice_no);
CREATE INDEX idx_invoices_bill_name     ON invoices(bill_name);
CREATE INDEX idx_invoices_status        ON invoices(status);
CREATE INDEX idx_invoice_items_inv_id   ON invoice_items(invoice_id);

-- ============================================================
-- SEED: Company defaults (optional reference row)
-- ============================================================
-- Insert a sample invoice for testing
INSERT INTO invoices (
    invoice_no, invoice_date, transport_mode, vehicle_number,
    reverse_charge, date_of_supply, state, state_code, place_of_supply,
    bill_name, bill_address, bill_gstin, bill_state, bill_state_code,
    ship_name, ship_address, ship_gstin, ship_state, ship_state_code,
    total_taxable, cgst_amount, sgst_amount, total_tax, total_after_tax,
    amount_in_words, bank_name, bank_ac, bank_ifsc, status
) VALUES (
    'SEW-22', '2026-01-30', 'By Hand', '',
    FALSE, '2026-01-30', 'MAHARASHTRA', '414111', 'A Nagar',
    'G-Tech Industries', 'MIDC, A Nagar', '27ARBPD6221C1ZY', 'MAHARASHTRA', '414111',
    'SHIVAM ENGINEERING WORKS', 'A-14/5, MIDC Ahmednagar', '27AEMPN1799P1ZF', 'MAHARASHTRA', '414111',
    3544.00, 319.00, 319.00, 638.00, 4182.00,
    'Four Thousand One Hundred Eighty Two Rupees Only',
    'G.S. Mahanagar Bank', '07701120000158', 'MCBL0960077', 'submitted'
);

INSERT INTO invoice_items (invoice_id, sr_no, product_description, hsn_code, qty, rate, amount, taxable_value, cgst_rate, cgst_amount, sgst_rate, sgst_amount, total)
VALUES
    (1, 1, '200×150×85 Grinding', '', 94, 1, 321, 321, 0, 0, 0, 0, 321),
    (1, 2, '230×230×88 Machining Grinding', '', 96, 2, 670, 670, 0, 0, 0, 0, 670),
    (1, 3, 'Various Machining Works', '', 2, 476, 952, 952, 0, 0, 0, 0, 952),
    (1, 4, '170×420×85 Machine Machining', '', 2, 308, 246, 246, 9, 319, 9, 319, 6182),
    (1, 5, '230×300×5 Machine Machining', '', 2, 569, 1139, 1139, 0, 0, 0, 0, 1139),
    (1, 6, '250×125×23 Finishing Grinding', '', 1, 267, 267, 267, 0, 0, 0, 0, 267);

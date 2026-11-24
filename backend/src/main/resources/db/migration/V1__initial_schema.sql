-- V1__initial_schema.sql
-- Order-to-Audit Manufacturing Management System - Complete Database Schema

-- ============================================================
-- USERS AND AUTHENTICATION
-- ============================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token VARCHAR(500) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCT CATEGORIES AND PRODUCTS (Finished Goods)
-- ============================================================
CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    category_id BIGINT REFERENCES product_categories(id),
    pack_size NUMERIC(10,2) NOT NULL,
    pack_unit VARCHAR(20) NOT NULL DEFAULT 'G',
    hsn_code VARCHAR(20) DEFAULT '2106',
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    selling_price NUMERIC(12,2) NOT NULL,
    mrp NUMERIC(12,2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INVENTORY ITEMS (Raw Materials, Packaging Materials)
-- ============================================================
CREATE TABLE inventory_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE,
    item_type VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    reorder_level NUMERIC(12,3) DEFAULT 0,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    gstin VARCHAR(15),
    state VARCHAR(50),
    state_code VARCHAR(2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PURCHASES
-- ============================================================
CREATE TABLE purchases (
    id BIGSERIAL PRIMARY KEY,
    purchase_number VARCHAR(30) NOT NULL UNIQUE,
    supplier_id BIGINT REFERENCES suppliers(id),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    inventory_item_id BIGINT NOT NULL REFERENCES inventory_items(id),
    quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price NUMERIC(12,4) NOT NULL,
    total_price NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STOCK MOVEMENTS (Central Stock Ledger)
-- ============================================================
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    inventory_item_id BIGINT REFERENCES inventory_items(id),
    product_id BIGINT REFERENCES products(id),
    movement_type VARCHAR(50) NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(12,4),
    total_cost NUMERIC(14,2),
    source_type VARCHAR(50) NOT NULL,
    source_id BIGINT,
    reference_number VARCHAR(50),
    notes TEXT,
    performed_by BIGINT REFERENCES users(id),
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_item_reference CHECK (
        (inventory_item_id IS NOT NULL AND product_id IS NULL) OR
        (inventory_item_id IS NULL AND product_id IS NOT NULL)
    )
);

CREATE INDEX idx_stock_movements_item ON stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_source ON stock_movements(source_type, source_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(performed_at);

-- ============================================================
-- BILL OF MATERIALS (BOM)
-- ============================================================
CREATE TABLE boms (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    version INT NOT NULL DEFAULT 1,
    batch_size NUMERIC(10,2) NOT NULL,
    batch_unit VARCHAR(20) NOT NULL DEFAULT 'PACKET',
    expected_output NUMERIC(10,2) NOT NULL,
    output_unit VARCHAR(20) NOT NULL DEFAULT 'PACKET',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, version)
);

CREATE TABLE bom_items (
    id BIGSERIAL PRIMARY KEY,
    bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
    inventory_item_id BIGINT NOT NULL REFERENCES inventory_items(id),
    quantity NUMERIC(12,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTION
-- ============================================================
CREATE TABLE production_runs (
    id BIGSERIAL PRIMARY KEY,
    run_number VARCHAR(30) NOT NULL UNIQUE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    bom_id BIGINT NOT NULL REFERENCES boms(id),
    batch_multiplier NUMERIC(6,2) NOT NULL DEFAULT 1.00,
    planned_output NUMERIC(10,2) NOT NULL,
    actual_good_output NUMERIC(10,2),
    damaged_output NUMERIC(10,2) DEFAULT 0,
    wastage_quantity NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    production_date DATE NOT NULL DEFAULT CURRENT_DATE,
    labour_cost NUMERIC(12,2) DEFAULT 0,
    gas_power_cost NUMERIC(12,2) DEFAULT 0,
    other_overhead_cost NUMERIC(12,2) DEFAULT 0,
    total_material_cost NUMERIC(14,2) DEFAULT 0,
    total_packaging_cost NUMERIC(14,2) DEFAULT 0,
    total_production_cost NUMERIC(14,2) DEFAULT 0,
    cost_per_packet NUMERIC(12,4) DEFAULT 0,
    notes TEXT,
    supervisor_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE production_material_issues (
    id BIGSERIAL PRIMARY KEY,
    production_run_id BIGINT NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
    inventory_item_id BIGINT NOT NULL REFERENCES inventory_items(id),
    planned_quantity NUMERIC(12,4) NOT NULL,
    actual_quantity NUMERIC(12,4) NOT NULL,
    damaged_quantity NUMERIC(12,4) DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(12,4) DEFAULT 0,
    total_cost NUMERIC(14,2) DEFAULT 0,
    variance_quantity NUMERIC(12,4) DEFAULT 0,
    variance_percentage NUMERIC(8,4) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    customer_type VARCHAR(30) DEFAULT 'RETAILER',
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    pincode VARCHAR(10),
    gstin VARCHAR(15),
    credit_limit NUMERIC(14,2) DEFAULT 0,
    assigned_salesman_id BIGINT REFERENCES users(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_salesman ON customers(assigned_salesman_id);

-- ============================================================
-- SALES ORDERS
-- ============================================================
CREATE TABLE sales_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    salesman_id BIGINT NOT NULL REFERENCES users(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    notes TEXT,
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_order_items (
    id BIGSERIAL PRIMARY KEY,
    sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(14,2) NOT NULL,
    available_stock NUMERIC(10,2),
    shortage_quantity NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_salesman ON sales_orders(salesman_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    financial_year VARCHAR(10) NOT NULL,
    gst_type VARCHAR(30) NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL,
    cgst_rate NUMERIC(5,2) DEFAULT 0,
    cgst_amount NUMERIC(12,2) DEFAULT 0,
    sgst_rate NUMERIC(5,2) DEFAULT 0,
    sgst_amount NUMERIC(12,2) DEFAULT 0,
    igst_rate NUMERIC(5,2) DEFAULT 0,
    igst_amount NUMERIC(12,2) DEFAULT 0,
    total_tax NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL,
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
    amount_due NUMERIC(14,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'POSTED',
    company_name VARCHAR(150),
    company_gstin VARCHAR(15),
    company_address TEXT,
    company_state VARCHAR(50),
    company_state_code VARCHAR(2),
    customer_name VARCHAR(150),
    customer_gstin VARCHAR(15),
    customer_address TEXT,
    customer_state VARCHAR(50),
    customer_state_code VARCHAR(2),
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    hsn_code VARCHAR(20),
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    taxable_value NUMERIC(14,2) NOT NULL,
    gst_rate NUMERIC(5,2) NOT NULL,
    cgst_amount NUMERIC(12,2) DEFAULT 0,
    sgst_amount NUMERIC(12,2) DEFAULT 0,
    igst_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_sequences (
    id BIGSERIAL PRIMARY KEY,
    financial_year VARCHAR(10) NOT NULL UNIQUE,
    last_number INT NOT NULL DEFAULT 0,
    prefix VARCHAR(10) DEFAULT 'INV'
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_fy ON invoices(financial_year);

-- ============================================================
-- DISPATCHES
-- ============================================================
CREATE TABLE dispatches (
    id BIGSERIAL PRIMARY KEY,
    dispatch_number VARCHAR(30) NOT NULL UNIQUE,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id),
    sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispatch_items (
    id BIGSERIAL PRIMARY KEY,
    dispatch_id BIGINT NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    payment_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    amount NUMERIC(14,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    reference_number VARCHAR(50),
    notes TEXT,
    received_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_allocations (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id),
    allocated_amount NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(payment_id, invoice_id)
);

CREATE INDEX idx_payments_customer ON payments(customer_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL,
    details TEXT,
    performed_by BIGINT REFERENCES users(id),
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(performed_at);

-- ============================================================
-- APP SETTINGS
-- ============================================================
CREATE TABLE app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- UNIT CONVERSIONS
-- ============================================================
CREATE TABLE unit_conversions (
    id BIGSERIAL PRIMARY KEY,
    from_unit VARCHAR(20) NOT NULL,
    to_unit VARCHAR(20) NOT NULL,
    conversion_factor NUMERIC(15,6) NOT NULL,
    UNIQUE(from_unit, to_unit)
);

-- ============================================================
-- SEED: Default Unit Conversions
-- ============================================================
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor) VALUES
('KG', 'G', 1000),
('G', 'KG', 0.001),
('L', 'ML', 1000),
('ML', 'L', 0.001);

-- ============================================================
-- SEED: Default App Settings
-- ============================================================
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('company.name', 'Sri Balaji Snacks Pvt Ltd', 'Company name'),
('company.gstin', '33AABCS1234A1Z5', 'Company GSTIN'),
('company.state', 'Tamil Nadu', 'Company state'),
('company.state_code', '33', 'Company state code'),
('gst.default_rate', '5.00', 'Default GST rate'),
('production.variance_tolerance', '3.00', 'Production variance tolerance %'),
('carton.packets_per_carton', '20', 'Default packets per carton');

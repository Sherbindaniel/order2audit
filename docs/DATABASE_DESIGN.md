# Database Design Document: Order-to-Audit ERP

## Overview
The Order-to-Audit system utilizes a normalized relational database with strict referential integrity, check constraints, foreign keys, and audit logging.

## Core Schema Structure

### 1. Users & Security
- `users`: User credentials, BCrypt password hash, role (`OWNER`, `ADMIN`, `SALESMAN`, `PRODUCTION_SUPERVISOR`, `ACCOUNTANT`), and status.
- `refresh_tokens`: Refresh tokens for JWT authentication.

### 2. Masters
- `product_categories`: Categorization for finished goods.
- `products`: Finished snack products (Murukku, Mixture, Chips, Sweets). Pack size (e.g. 200g), HSN code ("2106"), GST rate (5.00%), selling price (₹50.00 pre-tax).
- `inventory_items`: Raw materials (flour, oil, spice) and packaging materials (pouches, cartons). Reorder levels and units.
- `suppliers`: Material suppliers with state and GSTIN.
- `customers`: Retailers and distributors with place of supply (`state`, `state_code`), GSTIN, credit limits, assigned salesman.
- `unit_conversions`: Standard conversion factors (1 kg = 1000 g, 1 L = 1000 ml).

### 3. Production Engine (BOM & Runs)
- `boms`: Header for Bill of Materials versioned per product. Specifies batch size (200 pkts) and expected output (200 pkts).
- `bom_items`: Line items specifying standard recipe ingredients per batch (40kg flour, 10L oil, 1.2kg spice, 200 pouches, 10 cartons).
- `production_runs`: Execution of production batches. Stores planned output, actual good output, damaged output, wastage quantity, labour cost, power overheads, total material/packaging cost, total production cost, and calculated unit cost per good packet.
- `production_material_issues`: Planned vs actual consumption of each raw material and packaging component, variance quantity, variance percentage, unit weighted cost, and total cost.

### 4. Central Stock Movement Ledger
- `stock_movements`: Central immutable ledger tracking every single stock transaction.
  - Movement types: `OPENING_STOCK`, `PURCHASE_RECEIPT`, `PRODUCTION_ISSUE`, `PRODUCTION_OUTPUT`, `DISPATCH`, `RETURN`, `ADJUSTMENT`, `DAMAGED`.
  - Signed quantities: Positive for inward movements (opening, purchase, production output), negative for outward issues (production issue, dispatch, damaged).
  - Traceability: `source_type` (`PURCHASE`, `PRODUCTION`, `DISPATCH`, `OPENING`), `source_id`, `reference_number`, `performed_by`, `performed_at`.
  - Current stock formula: \`SUM(quantity)\` grouped by item/product.

### 5. Sales, Billing & Dispatch
- `sales_orders`: Orders placed by field salesmen. Customer, salesman, status (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `INVOICED`, `DISPATCHED`).
- `sales_order_items`: Line items with quantities, selling prices, available stock verification, and recorded shortages.
- `invoices`: Immutable GST tax invoices. Sequential numbering per financial year (\`INV/2024-25/NNN\`), place of supply tax determination (`INTRA_STATE` -> CGST + SGST, `INTER_STATE` -> IGST), amount paid, amount due.
- `invoice_items`: Taxable value, GST rates, CGST/SGST/IGST breakdown.
- `dispatches`: Warehouse dispatch record linked to invoice. Atomically reduces finished goods inventory.
- `dispatch_items`: Quantities dispatched.

### 6. Payments & Receivables
- `payments`: Payments received from customers via Cash, Cheque, Bank Transfer, UPI.
- `payment_allocations`: Links payments to specific invoices, updating \`amount_paid\` and \`amount_due\`. Prevents double allocation.

### 7. Audit Logging
- `audit_logs`: Entity-level audit trail (`entity_type`, `entity_id`, `action`, `details`, `performed_by`, `performed_at`).


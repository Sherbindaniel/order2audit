# REST API Documentation

## Base URL: `/api`

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Authenticate with username and password. Returns JWT token and user profile.
- `POST /api/auth/register` - Create new user (Admin/Owner only).

### Products (`/api/products`)
- `GET /api/products` - List all active products.
- `GET /api/products/{id}` - Get product details.
- `POST /api/products` - Create new product (Admin/Owner).
- `PUT /api/products/{id}` - Update product.
- `GET /api/products/categories` - List product categories.

### Central Inventory (`/api/inventory`)
- `GET /api/inventory/items` - List raw and packaging inventory items. Optional `?type=RAW_MATERIAL|PACKAGING_MATERIAL`.
- `GET /api/inventory/stock` - Current stock balances of all inventory items derived from ledger.
- `GET /api/inventory/stock/products` - Current stock balances of all finished goods products.
- `GET /api/inventory/stock/product/{id}` - Stock balance for specific finished good.
- `GET /api/inventory/ledger/{itemId}` - Complete movement ledger for item with running balance.
- `POST /api/inventory/opening-stock` - Record opening stock for inventory item.
- `POST /api/inventory/opening-stock/product` - Record opening stock for finished product.

### Purchases (`/api/purchases`)
- `POST /api/purchases` - Record purchase receipt. Atomically creates purchase and positive stock movements in the ledger.
- `GET /api/purchases` - List all purchases.
- `GET /api/purchases/{id}` - Get purchase detail with line items.

### BOM Management (`/api/boms`)
- `POST /api/boms` - Create BOM with version management.
- `GET /api/boms` - List all active BOMs.
- `GET /api/boms/{id}` - Get BOM recipe and requirements.
- `GET /api/boms/product/{productId}` - Get active BOM for a product.

### Production Runs (`/api/production`)
- `POST /api/production/runs` - Record and complete a production run.
  - Calculates planned consumption and expected yield based on BOM.
  - Captures actual consumption, damaged pouches, and scrap.
  - Evaluates consumption variance % and yield variance %.
  - Atomically records raw material issue movements (negative) and finished goods receipt (positive).
  - Calculates cost per good packet including raw materials, packaging, labour, and power.
- `GET /api/production/runs` - List production runs.
- `GET /api/production/runs/{id}` - Get production run details.
- `GET /api/production/runs/{id}/variance` - Detailed consumption variance report.
- `GET /api/production/summary` - Aggregate production floor summary.

### Sales Orders (`/api/orders`)
- `POST /api/orders` - Book order (Salesman). Automatically checks stock and flags shortages.
- `GET /api/orders` - List orders (filtered by user role).
- `GET /api/orders/{id}` - Get order details.
- `PUT /api/orders/{id}/approve` - Admin order approval/rejection with stock verification.

### GST Invoices & Dispatch (`/api/invoices`, `/api/dispatches`)
- `POST /api/invoices` - Generate sequential tax invoice from approved order. Automatically determines intra-state (CGST+SGST) vs inter-state (IGST).
- `GET /api/invoices` - List invoices.
- `GET /api/invoices/{id}` - Get invoice details.
- `GET /api/invoices/{id}/pdf` - Download high-quality PDF tax invoice.
- `POST /api/dispatches` - Dispatch goods. Atomically verifies available stock, creates dispatch record, and reduces finished goods inventory.

### Payments (`/api/payments`)
- `POST /api/payments` - Record customer payment and allocate to unpaid invoices.
- `GET /api/payments` - List payment receipts.
- `GET /api/payments/outstanding` - Outstanding balances and ageing analysis for all customers.
- `GET /api/payments/outstanding/{customerId}` - Outstanding balance and ageing for specific customer.

### Costing & Margins (`/api/costing`)
- `GET /api/costing/production/{runId}` - Detailed cost breakdown of a production run.
- `GET /api/costing/margins` - Product-wise gross margin and margin percentage report.

### Reports & Audit (`/api/reports`)
- `GET /api/reports/sales-register` - Sales invoice register with date filtering.
- `GET /api/reports/customer-sales` - Customer-wise turnover analysis.
- `GET /api/reports/product-sales` - Product-wise sales performance.
- `GET /api/reports/gst-summary` - GSTR-1 outward supplies summary.
- `GET /api/reports/purchases` - Material purchase register.
- `GET /api/reports/stock-summary` - Stock summary with opening, receipts, issues, and closing balances.
- `GET /api/reports/production` - Production execution report.
- `GET /api/reports/consumption-variance` - Material consumption variance report.
- `GET /api/reports/payments` - Collection report.
- `GET /api/reports/export/{reportType}?format=csv|excel` - Export reports to CSV or Excel.

### Dashboards (`/api/dashboard`)
- `GET /api/dashboard/owner` - Executive KPI dashboard.
- `GET /api/dashboard/admin` - Factory administration dashboard.
- `GET /api/dashboard/salesman` - Field salesman order dashboard.
- `GET /api/dashboard/production` - Production supervisor dashboard.
- `GET /api/dashboard/accountant` - Auditor financial summary.


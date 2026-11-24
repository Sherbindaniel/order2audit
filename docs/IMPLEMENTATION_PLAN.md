# Implementation Plan & Milestone Status

## Priority 1 — Production and Inventory Engine (Weight: 20%)
- [x] Product master CRUD with pack size, HSN ("2106"), GST rate (5%), and selling price
- [x] Raw material & packaging material master CRUD
- [x] Bill of Materials (BOM) master with versioning & snapshot capability
- [x] Production run management (batch multiplier, planned output, actual good output)
- [x] Material issues capturing actual consumption, damaged items, and wastage
- [x] Automated planned-versus-actual consumption variance calculation (%)
- [x] Automated planned-versus-actual yield variance calculation (%)
- [x] Tolerance check against configurable threshold (default 3%)
- [x] Central stock movement ledger with immutable signed quantities
- [x] Atomic transactional execution (material issues + production run + FG stock increase)
- [x] Standard unit conversion service (kg <-> g, L <-> ml)

## Priority 2 — Mandatory Benchmark Scenario (Weight: 30%)
- [x] Master data setup (Murukku 200g, 5 ingredients/packaging items, suppliers, customers)
- [x] Opening stock recorded through stock ledger
- [x] STEP 1: Record purchase 60 kg flour @ ₹45/kg (Weighted avg rate: ₹43.125)
- [x] STEP 2: Production run with actual issues (40kg flour, 10.5L oil, 1.2kg spice)
- [x] STEP 3: Record output (188 good pkts, 6 damaged pouches, 9 cartons used)
- [x] STEP 4: Salesman A order for Retailer A (150 pkts)
- [x] STEP 5: Admin approve, sequential tax invoice, dispatch 150 pkts
- [x] STEP 6: Salesman B order for Distributor B (120 pkts) -> Flag shortage of 32 pkts
- [x] STEP 7: Payment of ₹4,000 from Retailer A recorded and allocated
- [x] STEP 8: Production overheads (Labour ₹1,200, Gas/power ₹600) -> Cost/pkt ₹31.14
- [x] STEP 9: Monthly reporting & audit logs
- [x] Automated integration test verifying all 18 benchmark metrics (`BenchmarkIntegrationTest`)

## Priority 3 — Sales and GST Workflow (Weight: 15%)
- [x] Customer master with state, state code, GSTIN, assigned salesman
- [x] Salesman login & fast order booking (< 1 min)
- [x] Stock verification on order submission & approval
- [x] Sequential invoice numbering by financial year (`INV/YYYY-YY/NNN`)
- [x] Place of supply tax determination (Intra-state: CGST 2.5% + SGST 2.5%, Inter-state: IGST 5%)
- [x] OpenPDF tax invoice generation & download
- [x] Atomic dispatch with stock validation and finished goods reduction
- [x] Payment recording and allocation to unpaid invoices
- [x] Customer outstanding balance & ageing buckets (0-30, 31-60, 61-90, 90+ days)

## Priority 4 — Costing Engine (Embedded)
- [x] Weighted-average raw material valuation
- [x] Packaging materials costing (including damaged pouch treatment)
- [x] Production labour overhead allocation
- [x] Gas and power overhead allocation
- [x] Total production cost calculation
- [x] Cost per good packet calculation (Total cost / actual good output)
- [x] Product gross margin and margin percentage reports

## Priority 5 — Reporting and Audit Centre (Weight: 10%)
- [x] Sales register with date filtering
- [x] Customer-wise sales turnover
- [x] Product-wise sales performance
- [x] GST outward supplies summary (GSTR-1 mapping)
- [x] Purchase register
- [x] Stock summary (opening, receipts, issues, closing)
- [x] Stock movement ledger (traceable source transactions)
- [x] Production execution report
- [x] Consumption variance report
- [x] Payment collections register
- [x] Customer outstanding & ageing report
- [x] CSV and Apache POI Excel export support

## Priority 6 — Usability & Role-Based Dashboards (Weight: 10%)
- [x] Professional enterprise design system (Deep navy, clean slate, white cards)
- [x] Owner executive dashboard
- [x] Admin factory operations dashboard
- [x] Salesman field portal
- [x] Production floor dashboard
- [x] Accountant/Auditor financial portal
- [x] Quick demo user switcher on login screen
- [x] Responsive layout

## Priority 7 — Documentation & AI Handoff (Weight: 10%)
- [x] `PROJECT_CONTEXT.md`
- [x] `DATABASE_DESIGN.md`
- [x] `API_DOCUMENTATION.md`
- [x] `DECISIONS.md`
- [x] `TEST_STATUS.md`
- [x] `AI_HANDOFF.md`
- [x] Complete `README.md`

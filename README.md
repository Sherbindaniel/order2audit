# Order-to-Audit Manufacturing Management System
**Centre for Digital Infrastructure, NIT Tiruchirappalli — Internship Project**

---

## 1. Project Overview & Architecture

This is a complete, production-grade **Order-to-Audit Manufacturing Management System** built for a South Indian packaged snack manufacturer (**Sri Balaji Snacks Pvt Ltd**, Tiruchirappalli, Tamil Nadu).

The application eliminates fragmented communications (WhatsApp, phone calls, paper notebooks, loose spreadsheets) by unifying two core operational workflows connected through **finished-goods inventory**:

1. **Sales Workflow**: Field Salesman Order Booking → Stock Verification & Shortage Flagging → Admin Approval → Sequential GST Tax Invoicing → Warehouse Dispatch (Atomic FG reduction) → Payment Recording & Allocation → Receivables & Ageing.
2. **Production Workflow**: Raw Material Purchases (Weighted Average Costing) → Raw Material Stock Inward → BOM Master with Versioning → Material Issue → Batch Production Run → Actual Consumption vs Planned Variance → Yield Variance & Wastage → Finished Goods Increase → Real-time Costing Engine (Cost per Good Packet).

---

## 2. Technology Stack

- **Backend**: Java 21, Spring Boot 3.4.1, Spring Data JPA, Spring Security, JWT (io.jsonwebtoken), Bean Validation, Flyway migrations, Maven 3.9.16.
- **Database**: PostgreSQL 16 (production/docker) & H2 (PostgreSQL compatibility mode for tests).
- **PDF & Excel Export**: OpenPDF (LibrePDF) for professional GST Tax Invoices; Apache POI (5.3.0) for Excel export.
- **Frontend**: React 18, Vite 6, TypeScript 5, React Router 6, Axios, Lucide Icons, Enterprise CSS Design System.
- **Test Framework**: JUnit 5, Spring Boot Test, Transactional Integration Suite.

---

## 3. Mandatory Benchmark Scenario — Complete Verification

The system includes a dedicated, automated integration test suite (`BenchmarkIntegrationTest.java`) that executes the exact 9-step scenario from a clean state and asserts every required metric.

| Benchmark Check | Expected | System Calculated | Status |
| :--- | :---: | :---: | :---: |
| **Flour Closing Balance** | 120 kg | 120.000 kg | **PASS** |
| **Cooking Oil Closing Balance** | 19.5 L | 19.500 L | **PASS** |
| **Spice Mix Closing Balance** | 3.8 kg | 3.800 kg | **PASS** |
| **200g Pouches Closing Balance** | 306 pcs | 306.000 pcs | **PASS** |
| **Cartons Closing Balance** | 21 pcs | 21.000 pcs | **PASS** |
| **Finished Goods (Pre-dispatch)** | 238 pkts | 238.00 pkts | **PASS** |
| **Finished Goods (Post-dispatch)** | 88 pkts | 88.00 pkts | **PASS** |
| **Yield Variance %** | -6.00% | -6.0000% | **PASS** |
| **Oil Consumption Variance %** | +5.00% | +5.0000% | **PASS** |
| **Retailer A Taxable Value** | ₹7,500.00 | ₹7,500.00 | **PASS** |
| **CGST (Tamil Nadu -> TN, 2.5%)** | ₹187.50 | ₹187.50 | **PASS** |
| **SGST (Tamil Nadu -> TN, 2.5%)** | ₹187.50 | ₹187.50 | **PASS** |
| **Invoice Total Amount** | ₹7,875.00 | ₹7,875.00 | **PASS** |
| **Retailer A Outstanding (after ₹4,000 payment)** | ₹3,875.00 | ₹3,875.00 | **PASS** |
| **Distributor B Shortage Flag** | 32 pkts | 32.00 pkts | **PASS** |
| **Total Production Cost** | ₹5,855.00 | ₹5,855.00 | **PASS** |
| **Cost per Good Packet** | ~₹31.14 | ₹31.1436 | **PASS** |

### Benchmark Costing Breakdown
- **Weighted Average Flour Rate**: (100 kg @ ₹42 + 60 kg @ ₹45) / 160 kg = **₹43.125 / kg**
- **Flour (40 kg actual issue)**: ₹1,725.00
- **Oil (10.5 L actual issue)**: ₹1,470.00
- **Spice Mix (1.2 kg actual issue)**: ₹240.00
- **Pouches (188 good + 6 damaged = 194 @ ₹2.50)**: ₹485.00
- **Cartons (9 used @ ₹15.00)**: ₹135.00
- **Labour Overhead**: ₹1,200.00
- **Gas & Power Overhead**: ₹600.00
- **Total Production Cost**: **₹5,855.00**
- **Cost per Good Packet**: ₹5,855 / 188 actual good packets = **₹31.1436**

---

## 4. Role-Based Dashboards & Access

The application provides 5 distinct role experiences with demo accounts:

| Role | Username | Password | Key Responsibilities & Views |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner` | `owner123` | Executive KPI dashboard: Total sales turnover, receivables, finished goods stock, average cost per packet, low stock alerts, operational health. |
| **Admin** | `admin` | `admin123` | Factory administration: Order approval queue, stock verification, sequential GST invoice generation, warehouse dispatches. |
| **Salesman A** | `salesman_a` | `sales123` | Mobile-first fast order booking (< 1 min), assigned retail accounts, personal order status and monthly sales targets. |
| **Salesman B** | `salesman_b` | `sales123` | Inter-state distributor order booking (Karnataka), shortage alerts. |
| **Supervisor**| `supervisor`| `super123` | Production floor: BOM recipes, batch runs, actual material issues, scrap/damaged tracking, variance alerts. |
| **Auditor** | `auditor` | `audit123` | Read-only audit access: Sales register, purchase register, stock movement ledger, GST summary (GSTR-1), receivables ageing, Excel/CSV exports. |

---

## 5. Running the Application

### Option A: Local Development (With PostgreSQL)

#### 1. Start PostgreSQL (or use Docker)
```bash
docker-compose up -d postgres
```

#### 2. Run Backend (Spring Boot 3.4.1)
```bash
cd backend
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080` with database automatically migrated via Flyway and seeded with benchmark master data.*

### Option B: Zero-Config Standalone Development (No PostgreSQL required)
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
*Uses an embedded H2 database in PostgreSQL compatibility mode with file persistence (`./data/orderaudit`). Perfect for rapid development and testing without installing or running a local PostgreSQL service.*

### Running Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with proxy configured to `http://localhost:8080`.*

### Option C: Docker Compose (Full Stack)
```bash
docker-compose up --build
```

### Option D: Run Automated Benchmark Test
```bash
cd backend
mvn test -Dtest=BenchmarkIntegrationTest
```

---

## 6. Project Documentation Index

- `docs/PROJECT_CONTEXT.md` — Business rules, workflow specification, and technology overview.
- `docs/DATABASE_DESIGN.md` — Relational schema, tables, constraints, and stock ledger design.
- `docs/API_DOCUMENTATION.md` — Complete REST API endpoint reference.
- `docs/IMPLEMENTATION_PLAN.md` — Step-by-step evaluation priority checklist.
- `docs/DECISIONS.md` — Architectural and business decisions (costing method, GST place of supply, stock ledger).
- `docs/TEST_STATUS.md` — Test execution results and assertions.
- `docs/AI_HANDOFF.md` — Complete continuation guide for Amazon Q.


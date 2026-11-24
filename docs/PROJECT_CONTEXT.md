# Order-to-Audit Manufacturing Management System

## Project Context

### Objective
Build a complete, integrated Order-to-Audit system for a small South Indian packaged-snack manufacturer (Murukku, Mixture, Chips, Sweets). The system eliminates fragmented workflows (WhatsApp, phone calls, spreadsheets) with a unified application covering production, inventory, sales, billing, payments, costing, and audit reporting.

### Business Workflows

#### A. Sales Workflow
Salesman → Customer Selection → Order Creation → Admin Verification → Stock Verification → GST Invoice → Dispatch → Finished Goods Reduction → Payment Collection → Outstanding Balance

#### B. Production Workflow
Raw Material Purchase → Raw Material Inventory → BOM → Material Issue → Production Run → Actual Consumption → Wastage → Finished Goods Production → Inventory Update → Production Costing

Both workflows connect through **finished-goods inventory**.

### Technology Stack
- **Frontend**: React + Vite + TypeScript, React Router, Axios, CSS Modules
- **Backend**: Java 21, Spring Boot 3.4.x, Spring Data JPA, Spring Security + JWT, Maven
- **Database**: PostgreSQL 16, Flyway migrations
- **PDF**: OpenPDF (LibrePDF)
- **Excel**: Apache POI
- **Testing**: JUnit 5, H2 (test), Vitest + React Testing Library

### Architecture
Modular monolith with clean package separation:
- `auth/` — Authentication and JWT
- `user/` — User management
- `product/` — Products and categories
- `customer/` — Customer management
- `supplier/` — Supplier management
- `inventory/` — Central inventory engine and stock ledger
- `purchase/` — Purchase receipts
- `production/` — BOM and production runs (flagship module)
- `sales/` — Sales orders and dispatches
- `invoice/` — GST invoicing and PDF
- `payment/` — Payments and receivables
- `costing/` — Production costing engine
- `reporting/` — Reports and dashboards
- `audit/` — Audit logging
- `config/` — Security, CORS, app properties
- `common/` — Shared DTOs, exceptions, utilities

### Database Design
See `DATABASE_DESIGN.md` for complete schema. Key design decisions:
- Central stock_movements table as the stock ledger
- All stock changes create movement records
- Current stock = SUM of movements
- Referential integrity with foreign keys
- NUMERIC for all money/quantity fields
- Enums for status fields

### API Conventions
- Base URL: `/api/`
- REST endpoints grouped by module
- DTOs for all request/response (never expose entities)
- Global exception handling
- Pagination via Spring Pageable
- JWT Bearer token authentication
- Role-based authorization

### Business Rules
1. No negative stock without explicit adjustment
2. No dispatch without sufficient stock
3. No invalid order status transitions
4. Invoices are immutable once posted
5. No duplicate payment allocation
6. All stock changes are traceable via stock ledger
7. BOM versioning preserves historical production data
8. GST calculation based on place of supply
9. Weighted-average costing for raw materials
10. Sequential invoice numbering by financial year

### Current Development Status
Phase 1: Initial scaffolding and architecture - IN PROGRESS


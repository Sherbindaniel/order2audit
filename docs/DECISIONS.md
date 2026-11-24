# Architectural and Business Decisions

## Decision 1: Modular Monolith Architecture
**Choice**: Single Spring Boot application with clean package separation.
**Reason**: Project must be manageable by one developer and straightforward to demonstrate. Microservices would add unnecessary complexity for a small manufacturing system.

## Decision 2: Stock Balance Calculation
**Choice**: Current stock = SUM of all stock_movements quantities for an item.
**Reason**: Provides complete audit trail. Positive quantities for receipts (purchase, production output, opening stock), negative for issues (production issue, dispatch, damaged). No separate balance table needed — balance is always derivable from the ledger.

## Decision 3: Costing Method — Weighted Average
**Choice**: Weighted average raw material valuation.
**Reason**: Required by benchmark. Formula: (Opening Qty × Opening Rate + Purchase Qty × Purchase Rate) / Total Available Qty. Applied at the time of production issue to value consumption.

## Decision 4: GST Calculation
**Choice**: Place-of-supply based GST determination.
- Same state (company and customer both in Tamil Nadu): CGST (rate/2) + SGST (rate/2)
- Different state: IGST (full rate)
**Reason**: Standard Indian GST rules. Default rate 5% for snack products.

## Decision 5: Invoice Numbering
**Choice**: Sequential numbering by financial year: INV/YYYY-YY/NNN
**Reason**: GST compliance requires sequential numbering within a financial year. Maintained via invoice_sequences table with database-level concurrency control.

## Decision 6: BOM Versioning
**Choice**: Version number per product. New BOM version deactivates the old. Production runs reference the specific BOM version used.
**Reason**: Historical production runs must reference the recipe used at the time of production, not the current recipe.

## Decision 7: Stock Concurrency Control
**Choice**: Optimistic locking with stock validation at dispatch time within a transaction. Use SELECT ... FOR UPDATE semantics via JPA @Lock annotations for critical stock operations.
**Reason**: Prevents overselling without excessive pessimistic locking overhead for a small manufacturer.

## Decision 8: Pouch Accounting (Benchmark)
**Choice**: 188 pouches consumed for good production + 6 damaged = 194 total reduction. Total pouch reduction from initial 500 = 500 - 194 = 306 remaining.
**Reason**: Matches mandatory benchmark expected result.

## Decision 9: Carton Accounting (Benchmark)
**Choice**: Standard BOM specifies 10 cartons per batch, but benchmark records 9 cartons actually used. The variance is tracked and reported.
**Reason**: The benchmark explicitly states 9 cartons used for 188 packets. This demonstrates that actual consumption can differ from planned.

## Decision 10: Damaged Pouch Cost Inclusion
**Choice**: Damaged pouches (6 × ₹2.50 = ₹15) are included in packaging cost — they are consumed/wasted during production. Total pouch cost = 194 × ₹2.50 = ₹485.
**Reason**: Damaged materials are a cost of production, not recoverable. This matches benchmark reference costing of ₹485 for pouches.

## Decision 11: H2 for Testing
**Choice**: H2 in-memory database with PostgreSQL mode for unit/integration tests.
**Reason**: Faster test execution without requiring a running PostgreSQL instance. Schema created via JPA auto-DDL in test mode.

## Decision 12: Shortage Handling
**Choice**: When an order exceeds available stock, the system flags the shortage quantity on the order item. The order remains in APPROVED state but cannot be dispatched until stock is available. Partial dispatch is not implemented in the initial version — the order must be fulfilled completely or not at all.
**Reason**: Simplifies the initial implementation while clearly showing the shortage per the benchmark requirement (Distributor B shortage of 32 packets).


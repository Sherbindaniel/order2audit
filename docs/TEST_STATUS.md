# Test Status & Verification Report

## Automated Benchmark Test Execution

- **Suite**: `com.orderaudit.integration.BenchmarkIntegrationTest`
- **Result**: **BUILD SUCCESS** — 1 run, 0 failures, 0 errors, 0 skipped.
- **Execution Time**: ~8.9 seconds on Java 21 / Spring Boot 3.4.1

## Benchmark Metric Verification Matrix

| Check | Mandatory Benchmark Expected | System Value Generated | Status | Note |
|:---|:---:|:---:|:---:|:---|
| **Flour Closing Balance** | 120 kg | 120.000 kg | **PASSED** | 100 opening + 60 purchase - 40 production |
| **Cooking Oil Closing Balance** | 19.5 L | 19.500 L | **PASSED** | 30 opening - 10.5 production |
| **Spice Mix Closing Balance** | 3.8 kg | 3.800 kg | **PASSED** | 5 opening - 1.2 production |
| **200g Pouches Closing Balance** | 306 pcs | 306.000 pcs | **PASSED** | 500 opening - 188 good - 6 damaged |
| **Cartons Closing Balance** | 21 pcs | 21.000 pcs | **PASSED** | 30 opening - 9 used |
| **Finished Goods (Post-Production)** | 238 pkts | 238.00 pkts | **PASSED** | 50 opening + 188 actual good production |
| **Finished Goods (Post-Dispatch)** | 88 pkts | 88.00 pkts | **PASSED** | 238 available - 150 dispatched to Retailer A |
| **Yield Variance %** | -6% | -6.0000% | **PASSED** | (188 - 200) / 200 * 100 |
| **Oil Consumption Variance %** | +5% | +5.0000% | **PASSED** | (10.5 - 10.0) / 10.0 * 100 |
| **Retailer A Taxable Value** | ₹7,500.00 | ₹7,500.00 | **PASSED** | 150 pkts * ₹50.00 selling price |
| **CGST (Tamil Nadu -> TN, 2.5%)** | ₹187.50 | ₹187.50 | **PASSED** | Intra-state 2.5% |
| **SGST (Tamil Nadu -> TN, 2.5%)** | ₹187.50 | ₹187.50 | **PASSED** | Intra-state 2.5% |
| **Invoice Total Amount** | ₹7,875.00 | ₹7,875.00 | **PASSED** | Subtotal + CGST + SGST |
| **Retailer A Outstanding** | ₹3,875.00 | ₹3,875.00 | **PASSED** | ₹7,875 invoice - ₹4,000 payment |
| **Distributor B Shortage** | 32 pkts | 32.00 pkts | **PASSED** | 120 ordered - 88 available stock |
| **Weighted-Average Flour Rate** | ₹43.125/kg | ₹43.1250 | **PASSED** | (100*42 + 60*45)/160 = ₹43.125 |
| **Total Production Cost** | ₹5,855.00 | ₹5,855.00 | **PASSED** | Material ₹3,435 + Packaging ₹620 + Labour ₹1,200 + Gas/Power ₹600 |
| **Cost per Good Packet** | ~₹31.14 | ₹31.1436 | **PASSED** | ₹5,855 / 188 packets |

## Frontend Build Verification
- **Framework**: React 18 + Vite 6 + TypeScript 5
- **Status**: **BUILT SUCCESS**
- **Assets**: `dist/index.html` (0.74 kB), `dist/assets/index-B_4-J-KL.css` (4.17 kB), `dist/assets/index-D66u18Ty.js` (287 kB).

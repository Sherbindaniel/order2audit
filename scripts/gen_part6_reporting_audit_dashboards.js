const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../backend/src/main/java/com/orderaudit');

function writeFile(relPath, content) {
    const fullPath = path.join(BASE, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created:', relPath);
}

// 1. Reporting DTOs
writeFile('reporting/dto/SalesRegisterEntryDto.java', `
package com.orderaudit.reporting.dto;

import com.orderaudit.invoice.entity.GstType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesRegisterEntryDto {
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String customerName;
    private String customerGstin;
    private GstType gstType;
    private BigDecimal taxableValue;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal amountDue;
}
`);

writeFile('reporting/dto/CustomerSalesDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSalesDto {
    private Long customerId;
    private String customerName;
    private String state;
    private int totalInvoices;
    private BigDecimal totalTaxableValue;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
    private BigDecimal totalPaid;
    private BigDecimal totalOutstanding;
}
`);

writeFile('reporting/dto/ProductSalesDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSalesDto {
    private Long productId;
    private String productName;
    private String sku;
    private BigDecimal totalQuantity;
    private BigDecimal totalTaxableValue;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
}
`);

writeFile('reporting/dto/GstEntryDto.java', `
package com.orderaudit.reporting.dto;

import com.orderaudit.invoice.entity.GstType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstEntryDto {
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String customerName;
    private String customerGstin;
    private GstType gstType;
    private BigDecimal taxableValue;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
}
`);

writeFile('reporting/dto/GstSummaryDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstSummaryDto {
    private BigDecimal totalTaxableValue;
    private BigDecimal totalCgst;
    private BigDecimal totalSgst;
    private BigDecimal totalIgst;
    private BigDecimal totalTax;
    private List<GstEntryDto> entries;
}
`);

writeFile('reporting/dto/StockSummaryDto.java', `
package com.orderaudit.reporting.dto;

import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockSummaryDto {
    private Long itemId;
    private String itemName;
    private String code;
    private ItemType itemType;
    private UnitOfMeasure unit;
    private BigDecimal openingBalance;
    private BigDecimal totalReceipts;
    private BigDecimal totalIssues;
    private BigDecimal closingBalance;
}
`);

writeFile('reporting/dto/ProductionReportEntryDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionReportEntryDto {
    private String runNumber;
    private String productName;
    private LocalDate productionDate;
    private BigDecimal plannedOutput;
    private BigDecimal actualGoodOutput;
    private BigDecimal damagedOutput;
    private BigDecimal wastageQuantity;
    private BigDecimal yieldVariancePercentage;
    private BigDecimal totalProductionCost;
    private BigDecimal costPerPacket;
}
`);

writeFile('reporting/dto/ConsumptionVarianceEntryDto.java', `
package com.orderaudit.reporting.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumptionVarianceEntryDto {
    private String runNumber;
    private LocalDate productionDate;
    private String productName;
    private String materialName;
    private BigDecimal plannedQuantity;
    private BigDecimal actualQuantity;
    private UnitOfMeasure unit;
    private BigDecimal varianceQuantity;
    private BigDecimal variancePercentage;
    private boolean withinTolerance;
    private BigDecimal financialImpact;
}
`);

writeFile('reporting/dto/PaymentCollectionDto.java', `
package com.orderaudit.reporting.dto;

import com.orderaudit.payment.entity.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCollectionDto {
    private String paymentNumber;
    private LocalDate paymentDate;
    private String customerName;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
}
`);

writeFile('reporting/dto/PurchaseRegisterEntryDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRegisterEntryDto {
    private String purchaseNumber;
    private LocalDate purchaseDate;
    private String supplierName;
    private BigDecimal totalAmount;
    private String itemsDescription;
}
`);

// 2. Dashboard DTOs
writeFile('reporting/dto/SalesOrderSummary.java', `
package com.orderaudit.reporting.dto;

import com.orderaudit.sales.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderSummary {
    private Long id;
    private String orderNumber;
    private String customerName;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private LocalDate orderDate;
}
`);

writeFile('reporting/dto/OwnerDashboardDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerDashboardDto {
    private long todayOrdersCount;
    private BigDecimal totalSalesAmount;
    private BigDecimal totalFgStockPackets;
    private long totalRawMaterialsCount;
    private long totalProductionRuns;
    private BigDecimal avgCostPerPacket;
    private BigDecimal totalOutstandingDues;
    private long lowStockAlertsCount;
    private List<SalesOrderSummary> recentOrders;
}
`);

writeFile('reporting/dto/AdminDashboardDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {
    private long pendingOrdersApproval;
    private long todayInvoicesCount;
    private long todayDispatchesCount;
    private BigDecimal totalOutstanding;
    private List<SalesOrderSummary> pendingOrders;
}
`);

writeFile('reporting/dto/SalesmanDashboardDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesmanDashboardDto {
    private long myOrdersCount;
    private long myCustomersCount;
    private BigDecimal thisMonthSales;
    private List<SalesOrderSummary> recentOrders;
}
`);

writeFile('reporting/dto/ProductionDashboardDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionDashboardDto {
    private long totalRuns;
    private BigDecimal totalGoodPackets;
    private BigDecimal avgYield;
    private BigDecimal totalWastage;
    private long varianceAlertsCount;
    private List<ProductionReportEntryDto> recentRuns;
}
`);

writeFile('reporting/dto/AccountantDashboardDto.java', `
package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountantDashboardDto {
    private BigDecimal monthlySales;
    private BigDecimal monthlyPurchases;
    private BigDecimal totalTaxCollected;
    private BigDecimal totalPaymentsReceived;
    private BigDecimal totalOutstanding;
}
`);

// 3. Export Service (CSV and Apache POI Excel)
writeFile('reporting/service/ExportService.java', `
package com.orderaudit.reporting.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ExportService {

    public byte[] exportToCsv(List<String[]> rows, String[] headers) {
        StringBuilder sb = new StringBuilder();
        // Header
        sb.append(String.join(",", escapeCsv(headers))).append("\\n");
        // Rows
        for (String[] row : rows) {
            sb.append(String.join(",", escapeCsv(row))).append("\\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportToExcel(List<String[]> rows, String[] headers, String sheetName) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Write Header
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Write Data
            int rowIdx = 1;
            for (String[] rowData : rows) {
                Row row = sheet.createRow(rowIdx++);
                for (int col = 0; col < rowData.length; col++) {
                    row.createCell(col).setCellValue(rowData[col] != null ? rowData[col] : "");
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export Excel file", e);
        }
    }

    private String[] escapeCsv(String[] fields) {
        String[] result = new String[fields.length];
        for (int i = 0; i < fields.length; i++) {
            String val = fields[i] != null ? fields[i] : "";
            if (val.contains(",") || val.contains("\\"") || val.contains("\\n")) {
                val = "\\"" + val.replace("\\"", "\\"\\"") + "\\"";
            }
            result[i] = val;
        }
        return result;
    }
}
`);

// 4. Report Service
writeFile('reporting/service/ReportService.java', `
package com.orderaudit.reporting.service;

import com.orderaudit.config.AppProperties;
import com.orderaudit.customer.entity.Customer;
import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.MovementType;
import com.orderaudit.inventory.entity.StockMovement;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.repository.StockMovementRepository;
import com.orderaudit.invoice.entity.Invoice;
import com.orderaudit.invoice.entity.InvoiceItem;
import com.orderaudit.invoice.repository.InvoiceRepository;
import com.orderaudit.payment.entity.Payment;
import com.orderaudit.payment.repository.PaymentRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.entity.ProductionMaterialIssue;
import com.orderaudit.production.entity.ProductionRun;
import com.orderaudit.production.repository.ProductionRunRepository;
import com.orderaudit.purchase.entity.Purchase;
import com.orderaudit.purchase.entity.PurchaseItem;
import com.orderaudit.purchase.repository.PurchaseRepository;
import com.orderaudit.reporting.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final InvoiceRepository invoiceRepository;
    private final PurchaseRepository purchaseRepository;
    private final ProductionRunRepository productionRunRepository;
    private final StockMovementRepository stockMovementRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final PaymentRepository paymentRepository;
    private final AppProperties appProperties;

    public List<SalesRegisterEntryDto> getSalesRegister(LocalDate from, LocalDate to) {
        List<Invoice> invoices = (from != null && to != null) ?
                invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(from, to) :
                invoiceRepository.findAll();

        return invoices.stream().map(inv ->
                SalesRegisterEntryDto.builder()
                        .invoiceNumber(inv.getInvoiceNumber())
                        .invoiceDate(inv.getInvoiceDate())
                        .customerName(inv.getCustomerName())
                        .customerGstin(inv.getCustomerGstin())
                        .gstType(inv.getGstType())
                        .taxableValue(inv.getSubtotal())
                        .cgstAmount(inv.getCgstAmount())
                        .sgstAmount(inv.getSgstAmount())
                        .igstAmount(inv.getIgstAmount())
                        .totalTax(inv.getTotalTax())
                        .totalAmount(inv.getTotalAmount())
                        .amountPaid(inv.getAmountPaid())
                        .amountDue(inv.getAmountDue())
                        .build()
        ).collect(Collectors.toList());
    }

    public List<CustomerSalesDto> getCustomerWiseSales(LocalDate from, LocalDate to) {
        List<Invoice> invoices = (from != null && to != null) ?
                invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(from, to) :
                invoiceRepository.findAll();

        Map<Customer, List<Invoice>> grouped = invoices.stream().collect(Collectors.groupingBy(Invoice::getCustomer));
        List<CustomerSalesDto> list = new ArrayList<>();

        for (Map.Entry<Customer, List<Invoice>> entry : grouped.entrySet()) {
            Customer c = entry.getKey();
            List<Invoice> invs = entry.getValue();

            BigDecimal taxable = BigDecimal.ZERO;
            BigDecimal tax = BigDecimal.ZERO;
            BigDecimal total = BigDecimal.ZERO;
            BigDecimal paid = BigDecimal.ZERO;
            BigDecimal due = BigDecimal.ZERO;

            for (Invoice inv : invs) {
                taxable = taxable.add(inv.getSubtotal());
                tax = tax.add(inv.getTotalTax());
                total = total.add(inv.getTotalAmount());
                paid = paid.add(inv.getAmountPaid());
                due = due.add(inv.getAmountDue());
            }

            list.add(CustomerSalesDto.builder()
                    .customerId(c.getId())
                    .customerName(c.getName())
                    .state(c.getState())
                    .totalInvoices(invs.size())
                    .totalTaxableValue(taxable)
                    .totalTax(tax)
                    .totalAmount(total)
                    .totalPaid(paid)
                    .totalOutstanding(due)
                    .build());
        }

        return list;
    }

    public List<ProductSalesDto> getProductWiseSales(LocalDate from, LocalDate to) {
        List<Invoice> invoices = (from != null && to != null) ?
                invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(from, to) :
                invoiceRepository.findAll();

        Map<Product, List<InvoiceItem>> map = new HashMap<>();
        for (Invoice inv : invoices) {
            for (InvoiceItem item : inv.getItems()) {
                map.computeIfAbsent(item.getProduct(), k -> new ArrayList<>()).add(item);
            }
        }

        List<ProductSalesDto> list = new ArrayList<>();
        for (Map.Entry<Product, List<InvoiceItem>> entry : map.entrySet()) {
            Product p = entry.getKey();
            BigDecimal qty = BigDecimal.ZERO;
            BigDecimal taxable = BigDecimal.ZERO;
            BigDecimal tax = BigDecimal.ZERO;
            BigDecimal total = BigDecimal.ZERO;

            for (InvoiceItem item : entry.getValue()) {
                qty = qty.add(item.getQuantity());
                taxable = taxable.add(item.getTaxableValue());
                BigDecimal itemTax = item.getCgstAmount().add(item.getSgstAmount()).add(item.getIgstAmount());
                tax = tax.add(itemTax);
                total = total.add(item.getTotalAmount());
            }

            list.add(ProductSalesDto.builder()
                    .productId(p.getId())
                    .productName(p.getName())
                    .sku(p.getSku())
                    .totalQuantity(qty)
                    .totalTaxableValue(taxable)
                    .totalTax(tax)
                    .totalAmount(total)
                    .build());
        }

        return list;
    }

    public GstSummaryDto getGstSummary(LocalDate from, LocalDate to) {
        List<Invoice> invoices = (from != null && to != null) ?
                invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(from, to) :
                invoiceRepository.findAll();

        BigDecimal totalTaxable = BigDecimal.ZERO;
        BigDecimal totalCgst = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;
        BigDecimal totalIgst = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        List<GstEntryDto> entries = new ArrayList<>();

        for (Invoice inv : invoices) {
            totalTaxable = totalTaxable.add(inv.getSubtotal());
            totalCgst = totalCgst.add(inv.getCgstAmount());
            totalSgst = totalSgst.add(inv.getSgstAmount());
            totalIgst = totalIgst.add(inv.getIgstAmount());
            totalTax = totalTax.add(inv.getTotalTax());

            entries.add(GstEntryDto.builder()
                    .invoiceNumber(inv.getInvoiceNumber())
                    .invoiceDate(inv.getInvoiceDate())
                    .customerName(inv.getCustomerName())
                    .customerGstin(inv.getCustomerGstin())
                    .gstType(inv.getGstType())
                    .taxableValue(inv.getSubtotal())
                    .cgstAmount(inv.getCgstAmount())
                    .sgstAmount(inv.getSgstAmount())
                    .igstAmount(inv.getIgstAmount())
                    .totalTax(inv.getTotalTax())
                    .totalAmount(inv.getTotalAmount())
                    .build());
        }

        return GstSummaryDto.builder()
                .totalTaxableValue(totalTaxable)
                .totalCgst(totalCgst)
                .totalSgst(totalSgst)
                .totalIgst(totalIgst)
                .totalTax(totalTax)
                .entries(entries)
                .build();
    }

    public List<PurchaseRegisterEntryDto> getPurchaseRegister(LocalDate from, LocalDate to) {
        List<Purchase> purchases = (from != null && to != null) ?
                purchaseRepository.findByPurchaseDateBetweenOrderByPurchaseDateDesc(from, to) :
                purchaseRepository.findAll();

        return purchases.stream().map(p -> {
            String items = p.getItems().stream()
                    .map(i -> i.getInventoryItem().getName() + " (" + i.getQuantity() + " " + i.getUnit() + ")")
                    .collect(Collectors.joining(", "));
            return PurchaseRegisterEntryDto.builder()
                    .purchaseNumber(p.getPurchaseNumber())
                    .purchaseDate(p.getPurchaseDate())
                    .supplierName(p.getSupplier() != null ? p.getSupplier().getName() : "Direct")
                    .totalAmount(p.getTotalAmount())
                    .itemsDescription(items)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<StockSummaryDto> getStockSummary() {
        List<InventoryItem> items = inventoryItemRepository.findByActiveTrue();
        List<StockSummaryDto> list = new ArrayList<>();

        for (InventoryItem item : items) {
            List<StockMovement> movements = stockMovementRepository.findByInventoryItemIdOrderByPerformedAtAsc(item.getId());

            BigDecimal opening = BigDecimal.ZERO;
            BigDecimal receipts = BigDecimal.ZERO;
            BigDecimal issues = BigDecimal.ZERO;
            BigDecimal closing = BigDecimal.ZERO;

            for (StockMovement sm : movements) {
                closing = closing.add(sm.getQuantity());
                if (sm.getMovementType() == MovementType.OPENING_STOCK) {
                    opening = opening.add(sm.getQuantity());
                } else if (sm.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    receipts = receipts.add(sm.getQuantity());
                } else {
                    issues = issues.add(sm.getQuantity().abs());
                }
            }

            list.add(StockSummaryDto.builder()
                    .itemId(item.getId())
                    .itemName(item.getName())
                    .code(item.getCode())
                    .itemType(item.getItemType())
                    .unit(item.getUnit())
                    .openingBalance(opening)
                    .totalReceipts(receipts)
                    .totalIssues(issues)
                    .closingBalance(closing)
                    .build());
        }

        return list;
    }

    public List<ProductionReportEntryDto> getProductionReport(LocalDate from, LocalDate to) {
        List<ProductionRun> runs = (from != null && to != null) ?
                productionRunRepository.findByProductionDateBetweenOrderByProductionDateDesc(from, to) :
                productionRunRepository.findAll();

        return runs.stream().map(r -> {
            BigDecimal yieldVar = BigDecimal.ZERO;
            if (r.getPlannedOutput() != null && r.getPlannedOutput().compareTo(BigDecimal.ZERO) > 0 && r.getActualGoodOutput() != null) {
                yieldVar = r.getActualGoodOutput().subtract(r.getPlannedOutput())
                        .divide(r.getPlannedOutput(), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
            }

            return ProductionReportEntryDto.builder()
                    .runNumber(r.getRunNumber())
                    .productName(r.getProduct().getName())
                    .productionDate(r.getProductionDate())
                    .plannedOutput(r.getPlannedOutput())
                    .actualGoodOutput(r.getActualGoodOutput())
                    .damagedOutput(r.getDamagedOutput())
                    .wastageQuantity(r.getWastageQuantity())
                    .yieldVariancePercentage(yieldVar)
                    .totalProductionCost(r.getTotalProductionCost())
                    .costPerPacket(r.getCostPerPacket())
                    .build();
        }).collect(Collectors.toList());
    }

    public List<ConsumptionVarianceEntryDto> getConsumptionVarianceReport(LocalDate from, LocalDate to) {
        List<ProductionRun> runs = (from != null && to != null) ?
                productionRunRepository.findByProductionDateBetweenOrderByProductionDateDesc(from, to) :
                productionRunRepository.findAll();

        BigDecimal tolerance = appProperties.getProduction().getVarianceTolerance();
        List<ConsumptionVarianceEntryDto> list = new ArrayList<>();

        for (ProductionRun r : runs) {
            for (ProductionMaterialIssue issue : r.getMaterialIssues()) {
                boolean within = issue.getVariancePercentage().abs().compareTo(tolerance) <= 0;
                BigDecimal finImpact = issue.getVarianceQuantity().multiply(issue.getUnitCost()).setScale(2, RoundingMode.HALF_UP);

                list.add(ConsumptionVarianceEntryDto.builder()
                        .runNumber(r.getRunNumber())
                        .productionDate(r.getProductionDate())
                        .productName(r.getProduct().getName())
                        .materialName(issue.getInventoryItem().getName())
                        .plannedQuantity(issue.getPlannedQuantity())
                        .actualQuantity(issue.getActualQuantity())
                        .unit(issue.getUnit())
                        .varianceQuantity(issue.getVarianceQuantity())
                        .variancePercentage(issue.getVariancePercentage())
                        .withinTolerance(within)
                        .financialImpact(finImpact)
                        .build());
            }
        }

        return list;
    }

    public List<PaymentCollectionDto> getPaymentCollectionReport(LocalDate from, LocalDate to) {
        List<Payment> payments = (from != null && to != null) ?
                paymentRepository.findByPaymentDateBetweenOrderByPaymentDateDesc(from, to) :
                paymentRepository.findAll();

        return payments.stream().map(p ->
                PaymentCollectionDto.builder()
                        .paymentNumber(p.getPaymentNumber())
                        .paymentDate(p.getPaymentDate())
                        .customerName(p.getCustomer().getName())
                        .amount(p.getAmount())
                        .paymentMethod(p.getPaymentMethod())
                        .referenceNumber(p.getReferenceNumber())
                        .build()
        ).collect(Collectors.toList());
    }
}
`);

// 5. Dashboard Service
writeFile('reporting/service/DashboardService.java', `
package com.orderaudit.reporting.service;

import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.invoice.entity.Invoice;
import com.orderaudit.invoice.repository.InvoiceRepository;
import com.orderaudit.payment.entity.Payment;
import com.orderaudit.payment.repository.PaymentRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.entity.ProductionRun;
import com.orderaudit.production.repository.ProductionRunRepository;
import com.orderaudit.purchase.entity.Purchase;
import com.orderaudit.purchase.repository.PurchaseRepository;
import com.orderaudit.reporting.dto.*;
import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.entity.SalesOrder;
import com.orderaudit.sales.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final SalesOrderRepository salesOrderRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProductionRunRepository productionRunRepository;
    private final PurchaseRepository purchaseRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryService inventoryService;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public OwnerDashboardDto getOwnerDashboard() {
        LocalDate today = LocalDate.now();
        long todayOrders = salesOrderRepository.countByOrderDate(today);

        List<Invoice> allInvoices = invoiceRepository.findAll();
        BigDecimal totalSales = allInvoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDue = allInvoices.stream().map(Invoice::getAmountDue).reduce(BigDecimal.ZERO, BigDecimal::add);

        // FG Stock
        List<Product> products = productRepository.findByActiveTrue();
        BigDecimal totalFgPackets = BigDecimal.ZERO;
        for (Product p : products) {
            totalFgPackets = totalFgPackets.add(inventoryService.getCurrentProductStock(p.getId()));
        }

        // Production runs stats
        List<ProductionRun> runs = productionRunRepository.findAll();
        BigDecimal sumCost = runs.stream().map(r -> r.getCostPerPacket() != null ? r.getCostPerPacket() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avgCost = !runs.isEmpty() ? sumCost.divide(BigDecimal.valueOf(runs.size()), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        // Stock alerts
        long lowStockCount = inventoryService.getAllStockBalances(null).stream()
                .filter(b -> b.isLowStock()).count();

        // Recent orders
        List<SalesOrderSummary> recent = salesOrderRepository.findAll().stream()
                .sorted((a, b) -> b.getOrderDate().compareTo(a.getOrderDate()))
                .limit(5)
                .map(this::toOrderSummary)
                .collect(Collectors.toList());

        return OwnerDashboardDto.builder()
                .todayOrdersCount(todayOrders)
                .totalSalesAmount(totalSales)
                .totalFgStockPackets(totalFgPackets)
                .totalRawMaterialsCount(inventoryService.getAllStockBalances(ItemType.RAW_MATERIAL).size())
                .totalProductionRuns(runs.size())
                .avgCostPerPacket(avgCost)
                .totalOutstandingDues(totalDue)
                .lowStockAlertsCount(lowStockCount)
                .recentOrders(recent)
                .build();
    }

    public AdminDashboardDto getAdminDashboard() {
        long pending = salesOrderRepository.countByStatus(OrderStatus.SUBMITTED);
        long todayInvoices = invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(LocalDate.now(), LocalDate.now()).size();

        BigDecimal totalOutstanding = invoiceRepository.findAll().stream()
                .map(Invoice::getAmountDue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<SalesOrderSummary> pendingOrders = salesOrderRepository.findByStatusOrderByOrderDateDesc(OrderStatus.SUBMITTED).stream()
                .limit(10)
                .map(this::toOrderSummary)
                .collect(Collectors.toList());

        return AdminDashboardDto.builder()
                .pendingOrdersApproval(pending)
                .todayInvoicesCount(todayInvoices)
                .todayDispatchesCount(0) // Can be extended with dispatch repository
                .totalOutstanding(totalOutstanding)
                .pendingOrders(pendingOrders)
                .build();
    }

    public SalesmanDashboardDto getSalesmanDashboard(Long salesmanId) {
        List<SalesOrder> orders = salesOrderRepository.findBySalesmanIdOrderByOrderDateDesc(salesmanId);
        long customerCount = customerRepository.findByAssignedSalesmanId(salesmanId).size();

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        BigDecimal monthSales = orders.stream()
                .filter(o -> !o.getOrderDate().isBefore(startOfMonth))
                .map(SalesOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<SalesOrderSummary> recent = orders.stream()
                .limit(5)
                .map(this::toOrderSummary)
                .collect(Collectors.toList());

        return SalesmanDashboardDto.builder()
                .myOrdersCount(orders.size())
                .myCustomersCount(customerCount)
                .thisMonthSales(monthSales)
                .recentOrders(recent)
                .build();
    }

    public ProductionDashboardDto getProductionDashboard() {
        List<ProductionRun> runs = productionRunRepository.findAll();
        BigDecimal totalGood = runs.stream().map(r -> r.getActualGoodOutput() != null ? r.getActualGoodOutput() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPlanned = runs.stream().map(r -> r.getPlannedOutput() != null ? r.getPlannedOutput() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalWastage = runs.stream().map(r -> r.getWastageQuantity() != null ? r.getWastageQuantity() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgYield = totalPlanned.compareTo(BigDecimal.ZERO) > 0 ?
                totalGood.divide(totalPlanned, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")) : BigDecimal.ZERO;

        List<ProductionReportEntryDto> recent = runs.stream()
                .sorted((a, b) -> b.getProductionDate().compareTo(a.getProductionDate()))
                .limit(5)
                .map(r -> ProductionReportEntryDto.builder()
                        .runNumber(r.getRunNumber())
                        .productName(r.getProduct().getName())
                        .productionDate(r.getProductionDate())
                        .plannedOutput(r.getPlannedOutput())
                        .actualGoodOutput(r.getActualGoodOutput())
                        .damagedOutput(r.getDamagedOutput())
                        .wastageQuantity(r.getWastageQuantity())
                        .totalProductionCost(r.getTotalProductionCost())
                        .costPerPacket(r.getCostPerPacket())
                        .build())
                .collect(Collectors.toList());

        return ProductionDashboardDto.builder()
                .totalRuns(runs.size())
                .totalGoodPackets(totalGood)
                .avgYield(avgYield)
                .totalWastage(totalWastage)
                .varianceAlertsCount(0)
                .recentRuns(recent)
                .build();
    }

    public AccountantDashboardDto getAccountantDashboard() {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now();

        List<Invoice> monthInvoices = invoiceRepository.findByInvoiceDateBetweenOrderByInvoiceDateDesc(startOfMonth, endOfMonth);
        BigDecimal sales = monthInvoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tax = monthInvoices.stream().map(Invoice::getTotalTax).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Purchase> monthPurchases = purchaseRepository.findByPurchaseDateBetweenOrderByPurchaseDateDesc(startOfMonth, endOfMonth);
        BigDecimal purchases = monthPurchases.stream().map(Purchase::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Payment> monthPayments = paymentRepository.findByPaymentDateBetweenOrderByPaymentDateDesc(startOfMonth, endOfMonth);
        BigDecimal payments = monthPayments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOutstanding = invoiceRepository.findAll().stream().map(Invoice::getAmountDue).reduce(BigDecimal.ZERO, BigDecimal::add);

        return AccountantDashboardDto.builder()
                .monthlySales(sales)
                .monthlyPurchases(purchases)
                .totalTaxCollected(tax)
                .totalPaymentsReceived(payments)
                .totalOutstanding(totalOutstanding)
                .build();
    }

    private SalesOrderSummary toOrderSummary(SalesOrder o) {
        return SalesOrderSummary.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .customerName(o.getCustomer().getName())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus())
                .orderDate(o.getOrderDate())
                .build();
    }
}
`);

// 6. Controllers
writeFile('reporting/controller/ReportController.java', `
package com.orderaudit.reporting.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.reporting.dto.*;
import com.orderaudit.reporting.service.ExportService;
import com.orderaudit.reporting.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private final ExportService exportService;

    @GetMapping("/sales-register")
    public ResponseEntity<ApiResponse<List<SalesRegisterEntryDto>>> getSalesRegister(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getSalesRegister(from, to)));
    }

    @GetMapping("/customer-sales")
    public ResponseEntity<ApiResponse<List<CustomerSalesDto>>> getCustomerSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getCustomerWiseSales(from, to)));
    }

    @GetMapping("/product-sales")
    public ResponseEntity<ApiResponse<List<ProductSalesDto>>> getProductSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getProductWiseSales(from, to)));
    }

    @GetMapping("/gst-summary")
    public ResponseEntity<ApiResponse<GstSummaryDto>> getGstSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getGstSummary(from, to)));
    }

    @GetMapping("/purchases")
    public ResponseEntity<ApiResponse<List<PurchaseRegisterEntryDto>>> getPurchaseRegister(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getPurchaseRegister(from, to)));
    }

    @GetMapping("/stock-summary")
    public ResponseEntity<ApiResponse<List<StockSummaryDto>>> getStockSummary() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getStockSummary()));
    }

    @GetMapping("/production")
    public ResponseEntity<ApiResponse<List<ProductionReportEntryDto>>> getProductionReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getProductionReport(from, to)));
    }

    @GetMapping("/consumption-variance")
    public ResponseEntity<ApiResponse<List<ConsumptionVarianceEntryDto>>> getConsumptionVariance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getConsumptionVarianceReport(from, to)));
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentCollectionDto>>> getPaymentCollection(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getPaymentCollectionReport(from, to)));
    }

    @GetMapping("/export/{reportType}")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable String reportType,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        String[] headers;
        List<String[]> rows = new ArrayList<>();

        if ("sales-register".equalsIgnoreCase(reportType)) {
            headers = new String[]{"Invoice No", "Date", "Customer", "GSTIN", "Type", "Taxable (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Total (₹)"};
            for (SalesRegisterEntryDto e : reportService.getSalesRegister(from, to)) {
                rows.add(new String[]{e.getInvoiceNumber(), e.getInvoiceDate().toString(), e.getCustomerName(), e.getCustomerGstin(), e.getGstType().toString(), e.getTaxableValue().toString(), e.getCgstAmount().toString(), e.getSgstAmount().toString(), e.getIgstAmount().toString(), e.getTotalAmount().toString()});
            }
        } else {
            headers = new String[]{"Item", "Code", "Type", "Unit", "Opening", "Receipts", "Issues", "Closing"};
            for (StockSummaryDto s : reportService.getStockSummary()) {
                rows.add(new String[]{s.getItemName(), s.getCode(), s.getItemType().toString(), s.getUnit().toString(), s.getOpeningBalance().toString(), s.getTotalReceipts().toString(), s.getTotalIssues().toString(), s.getClosingBalance().toString()});
            }
        }

        byte[] fileBytes;
        String contentType;
        String filename = reportType + "." + ("excel".equalsIgnoreCase(format) ? "xlsx" : "csv");

        if ("excel".equalsIgnoreCase(format)) {
            fileBytes = exportService.exportToExcel(rows, headers, reportType);
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else {
            fileBytes = exportService.exportToCsv(rows, headers);
            contentType = "text/csv";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(contentType))
                .body(fileBytes);
    }
}
`);

writeFile('reporting/controller/DashboardController.java', `
package com.orderaudit.reporting.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.reporting.dto.*;
import com.orderaudit.reporting.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/owner")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<OwnerDashboardDto>> getOwnerDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getOwnerDashboard()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAdminDashboard()));
    }

    @GetMapping("/salesman")
    @PreAuthorize("hasAnyRole('SALESMAN', 'OWNER')")
    public ResponseEntity<ApiResponse<SalesmanDashboardDto>> getSalesmanDashboard(@AuthenticationPrincipal UserPrincipal user) {
        Long salesmanId = user != null ? user.getId() : 1L;
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getSalesmanDashboard(salesmanId)));
    }

    @GetMapping("/production")
    @PreAuthorize("hasAnyRole('PRODUCTION_SUPERVISOR', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductionDashboardDto>> getProductionDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getProductionDashboard()));
    }

    @GetMapping("/accountant")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'OWNER')")
    public ResponseEntity<ApiResponse<AccountantDashboardDto>> getAccountantDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAccountantDashboard()));
    }
}
`);

// 7. Audit Logging Module
writeFile('audit/entity/AuditLog.java', `
package com.orderaudit.audit.entity;

import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String details;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(name = "performed_at", nullable = false)
    @Builder.Default
    private LocalDateTime performedAt = LocalDateTime.now();
}
`);

writeFile('audit/repository/AuditLogRepository.java', `
package com.orderaudit.audit.repository;

import com.orderaudit.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByPerformedAtDesc(String entityType, Long entityId);
    List<AuditLog> findByPerformedAtBetweenOrderByPerformedAtDesc(LocalDateTime from, LocalDateTime to);
}
`);

writeFile('audit/service/AuditService.java', `
package com.orderaudit.audit.service;

import com.orderaudit.audit.entity.AuditLog;
import com.orderaudit.audit.repository.AuditLogRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Async
    public void log(String entityType, Long entityId, String action, String details, Long userId) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
            AuditLog auditLog = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .details(details)
                    .performedBy(user)
                    .performedAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    public List<AuditLog> getAuditLogsForEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByPerformedAtDesc(entityType, entityId);
    }
}
`);

// 8. DataInitializer (Benchmark Master Data & Default Users)
writeFile('config/DataInitializer.java', `
package com.orderaudit.config;

import com.orderaudit.customer.entity.Customer;
import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.inventory.entity.*;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.entity.ProductCategory;
import com.orderaudit.product.repository.ProductCategoryRepository;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.entity.Bom;
import com.orderaudit.production.entity.BomItem;
import com.orderaudit.production.repository.BomRepository;
import com.orderaudit.supplier.entity.Supplier;
import com.orderaudit.supplier.repository.SupplierRepository;
import com.orderaudit.user.entity.Role;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final BomRepository bomRepository;
    private final InventoryService inventoryService;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized. Skipping seed.");
            return;
        }

        log.info("Initializing Order-to-Audit Database with Benchmark Data...");

        // 1. Create Demo Users
        User owner = createUser("owner", "owner123", "Ramanathan Chettiar (Owner)", Role.OWNER);
        User admin = createUser("admin", "admin123", "Karthik Subramanian (Admin)", Role.ADMIN);
        User salesmanA = createUser("salesman_a", "sales123", "Murugan (Salesman A)", Role.SALESMAN);
        User salesmanB = createUser("salesman_b", "sales123", "Senthil (Salesman B)", Role.SALESMAN);
        User supervisor = createUser("supervisor", "super123", "Muthuvel (Production Supervisor)", Role.PRODUCTION_SUPERVISOR);
        User accountant = createUser("auditor", "audit123", "Sankaran & Co (Auditor)", Role.ACCOUNTANT);

        // 2. Product Category & Product: Murukku 200g
        ProductCategory snacksCat = categoryRepository.save(ProductCategory.builder()
                .name("Traditional Snacks")
                .description("South Indian crispy packaged snacks")
                .build());

        Product murukku = productRepository.save(Product.builder()
                .name("Murukku 200g")
                .sku("SNK-MRK-200")
                .category(snacksCat)
                .packSize(new BigDecimal("200.00"))
                .packUnit(UnitOfMeasure.G)
                .hsnCode("2106")
                .gstRate(new BigDecimal("5.00"))
                .sellingPrice(new BigDecimal("50.00")) // ₹50 before tax
                .mrp(new BigDecimal("60.00"))
                .active(true)
                .build());

        // 3. Raw Materials and Packaging Materials
        InventoryItem flour = createItem("Flour", "RM-FLOUR", ItemType.RAW_MATERIAL, UnitOfMeasure.KG, new BigDecimal("20"));
        InventoryItem oil = createItem("Cooking oil", "RM-OIL", ItemType.RAW_MATERIAL, UnitOfMeasure.L, new BigDecimal("10"));
        InventoryItem spice = createItem("Salt and spice mix", "RM-SPICE", ItemType.RAW_MATERIAL, UnitOfMeasure.KG, new BigDecimal("2"));
        InventoryItem pouch = createItem("200g pouch", "PM-POUCH", ItemType.PACKAGING_MATERIAL, UnitOfMeasure.PIECE, new BigDecimal("100"));
        InventoryItem carton = createItem("Carton", "PM-CARTON", ItemType.PACKAGING_MATERIAL, UnitOfMeasure.PIECE, new BigDecimal("10"));

        // 4. Standard BOM for Murukku 200g (one standard batch = 200 packets)
        Bom bom = Bom.builder()
                .product(murukku)
                .version(1)
                .batchSize(new BigDecimal("200.00"))
                .batchUnit(UnitOfMeasure.PACKET)
                .expectedOutput(new BigDecimal("200.00"))
                .outputUnit(UnitOfMeasure.PACKET)
                .active(true)
                .notes("Standard Murukku 200g 1-batch recipe")
                .createdBy(supervisor)
                .build();

        List<BomItem> bomItems = new ArrayList<>();
        bomItems.add(createBomItem(bom, flour, new BigDecimal("40.00"), UnitOfMeasure.KG));
        bomItems.add(createBomItem(bom, oil, new BigDecimal("10.00"), UnitOfMeasure.L));
        bomItems.add(createBomItem(bom, spice, new BigDecimal("1.20"), UnitOfMeasure.KG));
        bomItems.add(createBomItem(bom, pouch, new BigDecimal("200.00"), UnitOfMeasure.PIECE));
        bomItems.add(createBomItem(bom, carton, new BigDecimal("10.00"), UnitOfMeasure.PIECE));

        bom.setItems(bomItems);
        bomRepository.save(bom);

        // 5. Suppliers
        Supplier flourSupplier = supplierRepository.save(Supplier.builder()
                .name("Sri Meenakshi Agro Traders")
                .contactPerson("Venkatesh")
                .phone("+91-9842100001")
                .email("meenakshi.agro@gmail.com")
                .address("Market Road, Madurai")
                .gstin("33AABCT9876K1Z1")
                .state("Tamil Nadu")
                .stateCode("33")
                .active(true)
                .build());

        // 6. Customers: Retailer A in TN, Distributor B in Karnataka
        Customer retailerA = customerRepository.save(Customer.builder()
                .name("Retailer A (Kaveri Stores)")
                .customerType("RETAILER")
                .contactPerson("Annamalai")
                .phone("+91-9842111111")
                .email("kaveri.stores@gmail.com")
                .address("Main Bazaar, Thanjavur")
                .city("Thanjavur")
                .state("Tamil Nadu")
                .stateCode("33")
                .pincode("613001")
                .gstin("33AAACK1111A1Z9")
                .creditLimit(new BigDecimal("50000.00"))
                .assignedSalesman(salesmanA)
                .active(true)
                .build());

        Customer distributorB = customerRepository.save(Customer.builder()
                .name("Distributor B (Bangalore Sweets & Snacks)")
                .customerType("DISTRIBUTOR")
                .contactPerson("Prasad Rao")
                .phone("+91-9842222222")
                .email("bangalore.snacks@gmail.com")
                .address("Chickpet, Bengaluru")
                .city("Bengaluru")
                .state("Karnataka")
                .stateCode("29") // Inter-state
                .pincode("560053")
                .gstin("29BBBCD2222B1Z8")
                .creditLimit(new BigDecimal("100000.00"))
                .assignedSalesman(salesmanB)
                .active(true)
                .build());

        // 7. Benchmark Opening Inventory
        // Flour 100 kg @ ₹42
        inventoryService.recordOpeningStock(flour.getId(), new BigDecimal("100.00"), UnitOfMeasure.KG, new BigDecimal("42.00"), admin.getId());
        // Oil 30 L @ ₹140
        inventoryService.recordOpeningStock(oil.getId(), new BigDecimal("30.00"), UnitOfMeasure.L, new BigDecimal("140.00"), admin.getId());
        // Spice mix 5 kg @ ₹200
        inventoryService.recordOpeningStock(spice.getId(), new BigDecimal("5.00"), UnitOfMeasure.KG, new BigDecimal("200.00"), admin.getId());
        // Pouches 500 @ ₹2.50
        inventoryService.recordOpeningStock(pouch.getId(), new BigDecimal("500.00"), UnitOfMeasure.PIECE, new BigDecimal("2.50"), admin.getId());
        // Cartons 30 @ ₹15
        inventoryService.recordOpeningStock(carton.getId(), new BigDecimal("30.00"), UnitOfMeasure.PIECE, new BigDecimal("15.00"), admin.getId());
        // Finished Murukku 200g: 50 packets
        inventoryService.recordProductOpeningStock(murukku.getId(), new BigDecimal("50.00"), new BigDecimal("30.00"), admin.getId());

        log.info("Benchmark master data & opening balances successfully initialized!");
    }

    private User createUser(String username, String rawPassword, String fullName, Role role) {
        return userRepository.save(User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .role(role)
                .active(true)
                .build());
    }

    private InventoryItem createItem(String name, String code, ItemType type, UnitOfMeasure unit, BigDecimal reorder) {
        return inventoryItemRepository.save(InventoryItem.builder()
                .name(name)
                .code(code)
                .itemType(type)
                .unit(unit)
                .reorderLevel(reorder)
                .active(true)
                .build());
    }

    private BomItem createBomItem(Bom bom, InventoryItem item, BigDecimal qty, UnitOfMeasure unit) {
        return BomItem.builder()
                .bom(bom)
                .inventoryItem(item)
                .quantity(qty)
                .unit(unit)
                .build();
    }
}
`);

console.log('Part 6 Reporting, Audit, Dashboards & DataInitializer generated successfully!');


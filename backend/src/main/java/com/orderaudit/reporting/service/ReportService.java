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

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
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

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

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
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

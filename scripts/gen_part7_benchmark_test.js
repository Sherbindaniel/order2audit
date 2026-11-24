const fs = require('fs');
const path = require('path');

const BASE_TEST = path.resolve(__dirname, '../backend/src/test/java/com/orderaudit');

function writeFile(relPath, content) {
    const fullPath = path.join(BASE_TEST, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created test:', relPath);
}

writeFile('integration/BenchmarkIntegrationTest.java', `
package com.orderaudit.integration;

import com.orderaudit.costing.dto.CostingDto;
import com.orderaudit.costing.service.CostingService;
import com.orderaudit.customer.entity.Customer;
import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.invoice.dto.CreateInvoiceRequest;
import com.orderaudit.invoice.dto.InvoiceDto;
import com.orderaudit.invoice.entity.GstType;
import com.orderaudit.invoice.service.InvoiceService;
import com.orderaudit.payment.dto.CreatePaymentRequest;
import com.orderaudit.payment.dto.OutstandingDto;
import com.orderaudit.payment.entity.PaymentMethod;
import com.orderaudit.payment.service.PaymentService;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.entity.ProductCategory;
import com.orderaudit.product.repository.ProductCategoryRepository;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.dto.*;
import com.orderaudit.production.entity.Bom;
import com.orderaudit.production.entity.BomItem;
import com.orderaudit.production.repository.BomRepository;
import com.orderaudit.production.service.ProductionService;
import com.orderaudit.purchase.dto.CreatePurchaseRequest;
import com.orderaudit.purchase.dto.PurchaseItemRequest;
import com.orderaudit.purchase.service.PurchaseService;
import com.orderaudit.sales.dto.*;
import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.service.DispatchService;
import com.orderaudit.sales.service.SalesOrderService;
import com.orderaudit.supplier.entity.Supplier;
import com.orderaudit.supplier.repository.SupplierRepository;
import com.orderaudit.user.entity.Role;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class BenchmarkIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ProductCategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private InventoryItemRepository itemRepository;
    @Autowired private SupplierRepository supplierRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private BomRepository bomRepository;
    @Autowired private InventoryService inventoryService;
    @Autowired private PurchaseService purchaseService;
    @Autowired private ProductionService productionService;
    @Autowired private SalesOrderService salesOrderService;
    @Autowired private InvoiceService invoiceService;
    @Autowired private DispatchService dispatchService;
    @Autowired private PaymentService paymentService;
    @Autowired private CostingService costingService;

    private User admin;
    private User salesmanA;
    private User salesmanB;
    private Product murukku;
    private InventoryItem flour;
    private InventoryItem oil;
    private InventoryItem spice;
    private InventoryItem pouch;
    private InventoryItem carton;
    private Bom bom;
    private Supplier flourSupplier;
    private Customer retailerA;
    private Customer distributorB;

    @BeforeEach
    void setUpMasterDataAndOpeningInventory() {
        // 1. Users
        admin = userRepository.save(User.builder().username("admin_test").passwordHash("hash").fullName("Admin").role(Role.ADMIN).active(true).build());
        salesmanA = userRepository.save(User.builder().username("sales_a").passwordHash("hash").fullName("Salesman A").role(Role.SALESMAN).active(true).build());
        salesmanB = userRepository.save(User.builder().username("sales_b").passwordHash("hash").fullName("Salesman B").role(Role.SALESMAN).active(true).build());

        // 2. Product: Murukku 200g (Selling price ₹50 before tax, GST 5%)
        ProductCategory cat = categoryRepository.save(ProductCategory.builder().name("Snacks").build());
        murukku = productRepository.save(Product.builder()
                .name("Murukku 200g")
                .sku("MRK-200")
                .category(cat)
                .packSize(new BigDecimal("200.00"))
                .packUnit(UnitOfMeasure.G)
                .hsnCode("2106")
                .gstRate(new BigDecimal("5.00"))
                .sellingPrice(new BigDecimal("50.00"))
                .active(true)
                .build());

        // 3. Raw Materials & Packaging Items
        flour = itemRepository.save(InventoryItem.builder().name("Flour").code("RM-FLOUR").itemType(ItemType.RAW_MATERIAL).unit(UnitOfMeasure.KG).active(true).build());
        oil = itemRepository.save(InventoryItem.builder().name("Cooking oil").code("RM-OIL").itemType(ItemType.RAW_MATERIAL).unit(UnitOfMeasure.L).active(true).build());
        spice = itemRepository.save(InventoryItem.builder().name("Salt and spice mix").code("RM-SPICE").itemType(ItemType.RAW_MATERIAL).unit(UnitOfMeasure.KG).active(true).build());
        pouch = itemRepository.save(InventoryItem.builder().name("200g pouch").code("PM-POUCH").itemType(ItemType.PACKAGING_MATERIAL).unit(UnitOfMeasure.PIECE).active(true).build());
        carton = itemRepository.save(InventoryItem.builder().name("Carton").code("PM-CARTON").itemType(ItemType.PACKAGING_MATERIAL).unit(UnitOfMeasure.PIECE).active(true).build());

        // 4. Standard BOM: Batch 200 pkts -> Flour 40kg, Oil 10L, Spice 1.2kg, Pouches 200, Cartons 10
        bom = Bom.builder()
                .product(murukku)
                .version(1)
                .batchSize(new BigDecimal("200.00"))
                .batchUnit(UnitOfMeasure.PACKET)
                .expectedOutput(new BigDecimal("200.00"))
                .outputUnit(UnitOfMeasure.PACKET)
                .active(true)
                .build();

        List<BomItem> bItems = new ArrayList<>();
        bItems.add(BomItem.builder().bom(bom).inventoryItem(flour).quantity(new BigDecimal("40.00")).unit(UnitOfMeasure.KG).build());
        bItems.add(BomItem.builder().bom(bom).inventoryItem(oil).quantity(new BigDecimal("10.00")).unit(UnitOfMeasure.L).build());
        bItems.add(BomItem.builder().bom(bom).inventoryItem(spice).quantity(new BigDecimal("1.20")).unit(UnitOfMeasure.KG).build());
        bItems.add(BomItem.builder().bom(bom).inventoryItem(pouch).quantity(new BigDecimal("200.00")).unit(UnitOfMeasure.PIECE).build());
        bItems.add(BomItem.builder().bom(bom).inventoryItem(carton).quantity(new BigDecimal("10.00")).unit(UnitOfMeasure.PIECE).build());
        bom.setItems(bItems);
        bom = bomRepository.save(bom);

        // 5. Supplier & Customers
        flourSupplier = supplierRepository.save(Supplier.builder().name("Flour Supplier").state("Tamil Nadu").stateCode("33").active(true).build());

        // Retailer A in Tamil Nadu (Intra-state, stateCode 33)
        retailerA = customerRepository.save(Customer.builder()
                .name("Retailer A")
                .state("Tamil Nadu")
                .stateCode("33")
                .gstin("33AAACK1111A1Z9")
                .assignedSalesman(salesmanA)
                .active(true)
                .build());

        // Distributor B in Karnataka (Inter-state, stateCode 29)
        distributorB = customerRepository.save(Customer.builder()
                .name("Distributor B")
                .state("Karnataka")
                .stateCode("29")
                .gstin("29BBBCD2222B1Z8")
                .assignedSalesman(salesmanB)
                .active(true)
                .build());

        // 6. Opening Inventory:
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
    }

    @Test
    @DisplayName("Execute full 9-step mandatory benchmark scenario and verify all exact assertions")
    void executeMandatoryBenchmarkScenario() {
        // =========================================================================
        // STEP 1: Record purchase of 60 kg flour at ₹45/kg
        // =========================================================================
        CreatePurchaseRequest purchaseReq = CreatePurchaseRequest.builder()
                .supplierId(flourSupplier.getId())
                .purchaseDate(LocalDate.now())
                .items(List.of(
                        PurchaseItemRequest.builder()
                                .inventoryItemId(flour.getId())
                                .quantity(new BigDecimal("60.00"))
                                .unit(UnitOfMeasure.KG)
                                .unitPrice(new BigDecimal("45.00"))
                                .build()
                ))
                .build();
        purchaseService.createPurchase(purchaseReq, admin.getId());

        // Weighted Average Flour Rate: (100 * 42 + 60 * 45) / 160 = (4200 + 2700) / 160 = 6900 / 160 = 43.125
        BigDecimal weightedFlourRate = inventoryService.getWeightedAverageRate(flour.getId());
        assertEquals(new BigDecimal("43.1250"), weightedFlourRate.setScale(4, RoundingMode.HALF_UP));

        // =========================================================================
        // STEP 2 & 3: Production Run:
        // Issues: Flour 40kg, Oil 10.5L, Spice 1.2kg, Pouches 188 (good) + 6 (damaged) = 194, Cartons 9
        // Output: 188 good pkts, 6 damaged pouches
        // =========================================================================
        List<MaterialIssueRequest> issues = List.of(
                MaterialIssueRequest.builder().inventoryItemId(flour.getId()).actualQuantity(new BigDecimal("40.00")).build(),
                MaterialIssueRequest.builder().inventoryItemId(oil.getId()).actualQuantity(new BigDecimal("10.50")).build(),
                MaterialIssueRequest.builder().inventoryItemId(spice.getId()).actualQuantity(new BigDecimal("1.20")).build(),
                MaterialIssueRequest.builder().inventoryItemId(pouch.getId()).actualQuantity(new BigDecimal("188.00")).damagedQuantity(new BigDecimal("6.00")).build(),
                MaterialIssueRequest.builder().inventoryItemId(carton.getId()).actualQuantity(new BigDecimal("9.00")).build()
        );

        CreateProductionRunRequest prodReq = CreateProductionRunRequest.builder()
                .productId(murukku.getId())
                .bomId(bom.getId())
                .batchMultiplier(BigDecimal.ONE)
                .actualGoodOutput(new BigDecimal("188.00"))
                .damagedOutput(BigDecimal.ZERO)
                .wastageQuantity(BigDecimal.ZERO)
                .labourCost(new BigDecimal("1200.00"))
                .gasPowerCost(new BigDecimal("600.00"))
                .otherOverheadCost(BigDecimal.ZERO)
                .materialIssues(issues)
                .build();

        ProductionRunDto runDto = productionService.createAndCompleteProductionRun(prodReq, admin.getId());

        // =========================================================================
        // STEP 4: Salesman A places order for Retailer A in TN: 150 packets
        // =========================================================================
        CreateOrderRequest orderA = CreateOrderRequest.builder()
                .customerId(retailerA.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(murukku.getId()).quantity(new BigDecimal("150.00")).build()
                ))
                .build();
        SalesOrderDto orderADto = salesOrderService.createOrder(orderA, salesmanA.getId());

        // =========================================================================
        // STEP 5: Admin approves order, generates invoice, dispatches 150 packets
        // =========================================================================
        salesOrderService.approveOrder(orderADto.getId(), OrderApprovalRequest.builder().approved(true).build(), admin.getId());

        InvoiceDto invoiceA = invoiceService.generateInvoice(
                CreateInvoiceRequest.builder().salesOrderId(orderADto.getId()).build(),
                admin.getId()
        );

        dispatchService.createDispatch(
                CreateDispatchRequest.builder().invoiceId(invoiceA.getId()).build(),
                admin.getId()
        );

        // =========================================================================
        // STEP 6: Salesman B places order for Distributor B in Karnataka: 120 packets
        // Available stock is 88 packets -> Shortage of 32 packets
        // =========================================================================
        CreateOrderRequest orderB = CreateOrderRequest.builder()
                .customerId(distributorB.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(murukku.getId()).quantity(new BigDecimal("120.00")).build()
                ))
                .build();
        SalesOrderDto orderBDto = salesOrderService.createOrder(orderB, salesmanB.getId());
        salesOrderService.approveOrder(orderBDto.getId(), OrderApprovalRequest.builder().approved(true).build(), admin.getId());
        SalesOrderDto refreshedOrderB = salesOrderService.getOrderById(orderBDto.getId());

        // =========================================================================
        // STEP 7: Record payment of ₹4,000 from Retailer A
        // =========================================================================
        CreatePaymentRequest paymentReq = CreatePaymentRequest.builder()
                .customerId(retailerA.getId())
                .amount(new BigDecimal("4000.00"))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .referenceNumber("NEFT-998877")
                .build();
        paymentService.recordPayment(paymentReq, admin.getId());

        // =========================================================================
        // STEP 8: Production Overheads & Costing
        // =========================================================================
        CostingDto costing = costingService.getCostingForRun(runDto.getId());

        // =========================================================================
        // EXACT EXPECTED BENCHMARK ASSERTIONS
        // =========================================================================

        // 1. Flour closing balance = 100 opening + 60 purchase - 40 production = 120 kg
        assertEquals(0, new BigDecimal("120.000").compareTo(inventoryService.getCurrentStock(flour.getId())), "Flour closing balance must be 120 kg");

        // 2. Oil closing balance = 30 opening - 10.5 production = 19.5 L
        assertEquals(0, new BigDecimal("19.500").compareTo(inventoryService.getCurrentStock(oil.getId())), "Oil closing balance must be 19.5 L");

        // 3. Spice mix closing balance = 5 opening - 1.2 production = 3.8 kg
        assertEquals(0, new BigDecimal("3.800").compareTo(inventoryService.getCurrentStock(spice.getId())), "Spice mix closing balance must be 3.8 kg");

        // 4. Pouches closing balance = 500 opening - 188 good - 6 damaged = 306
        assertEquals(0, new BigDecimal("306.000").compareTo(inventoryService.getCurrentStock(pouch.getId())), "Pouches closing balance must be 306");

        // 5. Cartons closing balance = 30 opening - 9 used = 21
        assertEquals(0, new BigDecimal("21.000").compareTo(inventoryService.getCurrentStock(carton.getId())), "Cartons closing balance must be 21");

        // 6. Finished Goods after production = 50 opening + 188 production = 238
        // (Before dispatch of 150 packets, stock was 238)
        // After dispatch of 150 pkts = 238 - 150 = 88 packets
        BigDecimal currentFgStock = inventoryService.getCurrentProductStock(murukku.getId());
        assertEquals(0, new BigDecimal("88.00").compareTo(currentFgStock), "Finished goods closing balance after dispatch must be 88 packets");

        // 7. Yield variance = (188 - 200) / 200 * 100 = -6%
        assertEquals(0, new BigDecimal("-6.0000").compareTo(runDto.getYieldVariancePercentage()), "Yield variance must be -6%");

        // 8. Oil consumption variance = (10.5 - 10) / 10 * 100 = +5%
        MaterialIssueDto oilIssue = runDto.getMaterialIssues().stream()
                .filter(i -> i.getInventoryItemId().equals(oil.getId()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("5.0000").compareTo(oilIssue.getVariancePercentage()), "Oil consumption variance must be +5%");

        // 9. Retailer A taxable value = 150 pkts * ₹50 = ₹7,500
        assertEquals(0, new BigDecimal("7500.00").compareTo(invoiceA.getSubtotal()), "Retailer A taxable value must be ₹7,500");

        // 10. CGST = 2.5% of ₹7,500 = ₹187.50
        assertEquals(0, new BigDecimal("187.50").compareTo(invoiceA.getCgstAmount()), "CGST must be ₹187.50");

        // 11. SGST = 2.5% of ₹7,500 = ₹187.50
        assertEquals(0, new BigDecimal("187.50").compareTo(invoiceA.getSgstAmount()), "SGST must be ₹187.50");

        // 12. Invoice total = ₹7,500 + ₹187.50 + ₹187.50 = ₹7,875.00
        assertEquals(0, new BigDecimal("7875.00").compareTo(invoiceA.getTotalAmount()), "Invoice total must be ₹7,875.00");

        // 13. Retailer A outstanding after ₹4,000 payment = ₹7,875 - ₹4,000 = ₹3,875.00
        OutstandingDto retailerOutstanding = paymentService.getCustomerOutstanding(retailerA.getId());
        assertEquals(0, new BigDecimal("3875.00").compareTo(retailerOutstanding.getTotalOutstanding()), "Retailer A outstanding must be ₹3,875.00");

        // 14. Distributor B shortage = 120 ordered - 88 available = 32 packets
        SalesOrderItemDto itemB = refreshedOrderB.getItems().get(0);
        assertEquals(0, new BigDecimal("32.00").compareTo(itemB.getShortageQuantity()), "Distributor B shortage must be 32 packets");
        assertEquals(0, new BigDecimal("88.00").compareTo(itemB.getAvailableStock()), "Distributor B available stock must be 88 packets");

        // 15. Production Costing:
        // Flour: 40 * 43.125 = 1725
        // Oil: 10.5 * 140 = 1470
        // Spice: 1.2 * 200 = 240
        // Pouches: 194 * 2.50 = 485
        // Cartons: 9 * 15 = 135
        // Labour: 1200
        // Gas/power: 600
        // Total = 5855
        // Cost per packet = 5855 / 188 = 31.1436
        assertEquals(0, new BigDecimal("5855.00").compareTo(costing.getTotalProductionCost()), "Total production cost must be ₹5,855.00");
        assertEquals(0, new BigDecimal("31.1436").compareTo(costing.getCostPerPacket().setScale(4, RoundingMode.HALF_UP)), "Cost per packet must be ~₹31.14");
    }
}
`);

console.log('Part 7 BenchmarkIntegrationTest generated successfully!');


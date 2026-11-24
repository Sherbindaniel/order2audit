package com.orderaudit.config;

import com.orderaudit.customer.entity.Customer;
import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.inventory.entity.*;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.repository.StockMovementRepository;
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
    private final StockMovementRepository stockMovementRepository;

    @Override
    public void run(String... args) {
        log.info("Checking Order-to-Audit database initialization status...");

        // 1. Create Demo Users if not present
        User owner = userRepository.findByUsername("owner")
                .orElseGet(() -> createUser("owner", "owner123", "Ramanathan Chettiar (Owner)", Role.OWNER));
        User admin = userRepository.findByUsername("admin")
                .orElseGet(() -> createUser("admin", "admin123", "Karthik Subramanian (Admin)", Role.ADMIN));
        User salesmanA = userRepository.findByUsername("salesman_a")
                .orElseGet(() -> createUser("salesman_a", "sales123", "Murugan (Salesman A)", Role.SALESMAN));
        User salesmanB = userRepository.findByUsername("salesman_b")
                .orElseGet(() -> createUser("salesman_b", "sales123", "Senthil (Salesman B)", Role.SALESMAN));
        User supervisor = userRepository.findByUsername("supervisor")
                .orElseGet(() -> createUser("supervisor", "super123", "Muthuvel (Production Supervisor)", Role.PRODUCTION_SUPERVISOR));
        User accountant = userRepository.findByUsername("auditor")
                .orElseGet(() -> createUser("auditor", "audit123", "Sankaran & Co (Auditor)", Role.ACCOUNTANT));

        // 2. Product Category & Product: Murukku 200g
        Product murukku = productRepository.findBySku("SNK-MRK-200").orElseGet(() -> {
            ProductCategory snacksCat = categoryRepository.findByName("Traditional Snacks")
                    .orElseGet(() -> categoryRepository.save(ProductCategory.builder()
                            .name("Traditional Snacks")
                            .description("South Indian crispy packaged snacks")
                            .build()));

            return productRepository.save(Product.builder()
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
        });

        // 3. Raw Materials and Packaging Materials
        InventoryItem flour = getOrCreateItem("Flour", "RM-FLOUR", ItemType.RAW_MATERIAL, UnitOfMeasure.KG, new BigDecimal("20"));
        InventoryItem oil = getOrCreateItem("Cooking oil", "RM-OIL", ItemType.RAW_MATERIAL, UnitOfMeasure.L, new BigDecimal("10"));
        InventoryItem spice = getOrCreateItem("Salt and spice mix", "RM-SPICE", ItemType.RAW_MATERIAL, UnitOfMeasure.KG, new BigDecimal("2"));
        InventoryItem pouch = getOrCreateItem("200g pouch", "PM-POUCH", ItemType.PACKAGING_MATERIAL, UnitOfMeasure.PIECE, new BigDecimal("100"));
        InventoryItem carton = getOrCreateItem("Carton", "PM-CARTON", ItemType.PACKAGING_MATERIAL, UnitOfMeasure.PIECE, new BigDecimal("10"));

        // 4. Standard BOM for Murukku 200g (one standard batch = 200 packets)
        if (bomRepository.count() == 0) {
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
            log.info("Initialized default BOM for Murukku 200g");
        }

        // 5. Suppliers
        if (supplierRepository.count() == 0) {
            supplierRepository.save(Supplier.builder()
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
            log.info("Initialized default Supplier");
        }

        // 6. Customers: Retailer A in TN, Distributor B in Karnataka, plus extra TN customers
        if (customerRepository.count() == 0) {
            customerRepository.save(Customer.builder()
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

            customerRepository.save(Customer.builder()
                    .name("Distributor B (Bangalore Sweets & Snacks)")
                    .customerType("DISTRIBUTOR")
                    .contactPerson("Prasad Rao")
                    .phone("+91-9842222222")
                    .email("bangalore.snacks@gmail.com")
                    .address("Chickpet, Bengaluru")
                    .city("Bengaluru")
                    .state("Karnataka")
                    .stateCode("29") // Inter-state IGST
                    .pincode("560053")
                    .gstin("29BBBCD2222B1Z8")
                    .creditLimit(new BigDecimal("100000.00"))
                    .assignedSalesman(salesmanB)
                    .active(true)
                    .build());

            customerRepository.save(Customer.builder()
                    .name("Sri Krishna Sweets & Bakery")
                    .customerType("RETAILER")
                    .contactPerson("Ganesan")
                    .phone("+91-9842333333")
                    .email("krishna.bakery@gmail.com")
                    .address("NSB Road, Tiruchirappalli")
                    .city("Tiruchirappalli")
                    .state("Tamil Nadu")
                    .stateCode("33")
                    .pincode("620002")
                    .gstin("33AAACG3333C1Z7")
                    .creditLimit(new BigDecimal("35000.00"))
                    .assignedSalesman(salesmanA)
                    .active(true)
                    .build());

            customerRepository.save(Customer.builder()
                    .name("Murugan Provision Store")
                    .customerType("RETAILER")
                    .contactPerson("Shanmugam")
                    .phone("+91-9842444444")
                    .email("murugan.provisions@gmail.com")
                    .address("Town Hall Road, Madurai")
                    .city("Madurai")
                    .state("Tamil Nadu")
                    .stateCode("33")
                    .pincode("625001")
                    .gstin("33AAACM4444D1Z6")
                    .creditLimit(new BigDecimal("25000.00"))
                    .assignedSalesman(salesmanB)
                    .active(true)
                    .build());

            log.info("Initialized default Customers (Retailers & Distributors)");
        }

        // 7. Benchmark Opening Inventory
        if (stockMovementRepository.count() == 0) {
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
            // Finished Murukku 200g: 50 packets @ ₹30
            inventoryService.recordProductOpeningStock(murukku.getId(), new BigDecimal("50.00"), new BigDecimal("30.00"), admin.getId());
            log.info("Initialized opening stock balances");
        }

        log.info("Order-to-Audit Database verification complete!");
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

    private InventoryItem getOrCreateItem(String name, String code, ItemType type, UnitOfMeasure unit, BigDecimal reorder) {
        return inventoryItemRepository.findByCode(code).orElseGet(() ->
                inventoryItemRepository.save(InventoryItem.builder()
                        .name(name)
                        .code(code)
                        .itemType(type)
                        .unit(unit)
                        .reorderLevel(reorder)
                        .active(true)
                        .build())
        );
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

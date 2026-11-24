const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../backend/src/main/java/com/orderaudit');

function writeFile(relPath, content) {
    const fullPath = path.join(BASE, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created:', relPath);
}

// 1. Purchase Entities
writeFile('purchase/entity/PurchaseStatus.java', `
package com.orderaudit.purchase.entity;

public enum PurchaseStatus {
    DRAFT,
    RECEIVED,
    CANCELLED
}
`);

writeFile('purchase/entity/Purchase.java', `
package com.orderaudit.purchase.entity;

import com.orderaudit.supplier.entity.Supplier;
import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Purchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "purchase_number", nullable = false, unique = true, length = 30)
    private String purchaseNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "purchase_date", nullable = false)
    @Builder.Default
    private LocalDate purchaseDate = LocalDate.now();

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private PurchaseStatus status = PurchaseStatus.RECEIVED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
`);

writeFile('purchase/entity/PurchaseItem.java', `
package com.orderaudit.purchase.entity;

import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_id", nullable = false)
    private Purchase purchase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnitOfMeasure unit;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

// 2. Purchase Repositories
writeFile('purchase/repository/PurchaseRepository.java', `
package com.orderaudit.purchase.repository;

import com.orderaudit.purchase.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    Optional<Purchase> findByPurchaseNumber(String purchaseNumber);
    List<Purchase> findByPurchaseDateBetweenOrderByPurchaseDateDesc(LocalDate from, LocalDate to);
    long countByPurchaseDate(LocalDate date);
}
`);

writeFile('purchase/repository/PurchaseItemRepository.java', `
package com.orderaudit.purchase.repository;

import com.orderaudit.purchase.entity.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {
    List<PurchaseItem> findByPurchaseId(Long purchaseId);
}
`);

// 3. Purchase DTOs
writeFile('purchase/dto/PurchaseItemDto.java', `
package com.orderaudit.purchase.dto;

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
public class PurchaseItemDto {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemName;
    private BigDecimal quantity;
    private UnitOfMeasure unit;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}
`);

writeFile('purchase/dto/PurchaseDto.java', `
package com.orderaudit.purchase.dto;

import com.orderaudit.purchase.entity.PurchaseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseDto {
    private Long id;
    private String purchaseNumber;
    private Long supplierId;
    private String supplierName;
    private LocalDate purchaseDate;
    private BigDecimal totalAmount;
    private PurchaseStatus status;
    private String notes;
    private List<PurchaseItemDto> items;
}
`);

writeFile('purchase/dto/PurchaseItemRequest.java', `
package com.orderaudit.purchase.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseItemRequest {
    @NotNull(message = "Item ID is required")
    private Long inventoryItemId;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotNull(message = "Unit is required")
    private UnitOfMeasure unit;

    @NotNull(message = "Unit price is required")
    private BigDecimal unitPrice;
}
`);

writeFile('purchase/dto/CreatePurchaseRequest.java', `
package com.orderaudit.purchase.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseRequest {
    private Long supplierId;
    private LocalDate purchaseDate;
    private String notes;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<PurchaseItemRequest> items;
}
`);

// 4. Purchase Service and Controller
writeFile('purchase/service/PurchaseService.java', `
package com.orderaudit.purchase.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.purchase.dto.CreatePurchaseRequest;
import com.orderaudit.purchase.dto.PurchaseDto;
import com.orderaudit.purchase.dto.PurchaseItemDto;
import com.orderaudit.purchase.dto.PurchaseItemRequest;
import com.orderaudit.purchase.entity.Purchase;
import com.orderaudit.purchase.entity.PurchaseItem;
import com.orderaudit.purchase.entity.PurchaseStatus;
import com.orderaudit.purchase.repository.PurchaseRepository;
import com.orderaudit.supplier.entity.Supplier;
import com.orderaudit.supplier.repository.SupplierRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseService {
    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;

    @Transactional
    public PurchaseDto createPurchase(CreatePurchaseRequest req, Long userId) {
        Supplier supplier = null;
        if (req.getSupplierId() != null) {
            supplier = supplierRepository.findById(req.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", req.getSupplierId()));
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        LocalDate date = req.getPurchaseDate() != null ? req.getPurchaseDate() : LocalDate.now();

        String purchaseNumber = generatePurchaseNumber(date);

        Purchase purchase = Purchase.builder()
                .purchaseNumber(purchaseNumber)
                .supplier(supplier)
                .purchaseDate(date)
                .totalAmount(BigDecimal.ZERO)
                .status(PurchaseStatus.RECEIVED)
                .notes(req.getNotes())
                .createdBy(user)
                .build();

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<PurchaseItem> itemList = new ArrayList<>();

        for (PurchaseItemRequest itemReq : req.getItems()) {
            InventoryItem invItem = inventoryItemRepository.findById(itemReq.getInventoryItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemReq.getInventoryItemId()));

            BigDecimal total = itemReq.getQuantity().multiply(itemReq.getUnitPrice());
            grandTotal = grandTotal.add(total);

            PurchaseItem pi = PurchaseItem.builder()
                    .purchase(purchase)
                    .inventoryItem(invItem)
                    .quantity(itemReq.getQuantity())
                    .unit(itemReq.getUnit())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(total)
                    .build();

            itemList.add(pi);
        }

        purchase.setTotalAmount(grandTotal);
        purchase.setItems(itemList);

        Purchase saved = purchaseRepository.save(purchase);

        // Record stock movements in the ledger for each purchased item
        for (PurchaseItem pi : saved.getItems()) {
            inventoryService.recordPurchaseReceipt(
                    pi.getInventoryItem().getId(),
                    pi.getQuantity(),
                    pi.getUnit(),
                    pi.getUnitPrice(),
                    saved.getId(),
                    saved.getPurchaseNumber(),
                    userId
            );
        }

        return toDto(saved);
    }

    public PurchaseDto getPurchaseById(Long id) {
        Purchase p = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", id));
        return toDto(p);
    }

    public List<PurchaseDto> getAllPurchases() {
        return purchaseRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<PurchaseDto> getPurchasesByDateRange(LocalDate from, LocalDate to) {
        return purchaseRepository.findByPurchaseDateBetweenOrderByPurchaseDateDesc(from, to)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private String generatePurchaseNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = purchaseRepository.countByPurchaseDate(date) + 1;
        return String.format("PUR-%s-%03d", dateStr, count);
    }

    private PurchaseDto toDto(Purchase p) {
        List<PurchaseItemDto> items = p.getItems() != null ? p.getItems().stream().map(i ->
                PurchaseItemDto.builder()
                        .id(i.getId())
                        .inventoryItemId(i.getInventoryItem().getId())
                        .inventoryItemName(i.getInventoryItem().getName())
                        .quantity(i.getQuantity())
                        .unit(i.getUnit())
                        .unitPrice(i.getUnitPrice())
                        .totalPrice(i.getTotalPrice())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return PurchaseDto.builder()
                .id(p.getId())
                .purchaseNumber(p.getPurchaseNumber())
                .supplierId(p.getSupplier() != null ? p.getSupplier().getId() : null)
                .supplierName(p.getSupplier() != null ? p.getSupplier().getName() : null)
                .purchaseDate(p.getPurchaseDate())
                .totalAmount(p.getTotalAmount())
                .status(p.getStatus())
                .notes(p.getNotes())
                .items(items)
                .build();
    }
}
`);

writeFile('purchase/controller/PurchaseController.java', `
package com.orderaudit.purchase.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.purchase.dto.CreatePurchaseRequest;
import com.orderaudit.purchase.dto.PurchaseDto;
import com.orderaudit.purchase.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {
    private final PurchaseService purchaseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR')")
    public ResponseEntity<ApiResponse<PurchaseDto>> createPurchase(
            @Valid @RequestBody CreatePurchaseRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Purchase recorded successfully", purchaseService.createPurchase(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseDto>>> getAllPurchases() {
        return ResponseEntity.ok(ApiResponse.ok(purchaseService.getAllPurchases()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseDto>> getPurchaseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(purchaseService.getPurchaseById(id)));
    }
}
`);

// 5. Production Entities
writeFile('production/entity/ProductionStatus.java', `
package com.orderaudit.production.entity;

public enum ProductionStatus {
    PLANNED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
`);

writeFile('production/entity/Bom.java', `
package com.orderaudit.production.entity;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import com.orderaudit.product.entity.Product;
import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "boms", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"product_id", "version"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    @Builder.Default
    private int version = 1;

    @Column(name = "batch_size", nullable = false, precision = 10, scale = 2)
    private BigDecimal batchSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "batch_unit", nullable = false, length = 20)
    @Builder.Default
    private UnitOfMeasure batchUnit = UnitOfMeasure.PACKET;

    @Column(name = "expected_output", nullable = false, precision = 10, scale = 2)
    private BigDecimal expectedOutput;

    @Enumerated(EnumType.STRING)
    @Column(name = "output_unit", nullable = false, length = 20)
    @Builder.Default
    private UnitOfMeasure outputUnit = UnitOfMeasure.PACKET;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "bom", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BomItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
`);

writeFile('production/entity/BomItem.java', `
package com.orderaudit.production.entity;

import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bom_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bom_id", nullable = false)
    private Bom bom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnitOfMeasure unit;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

writeFile('production/entity/ProductionRun.java', `
package com.orderaudit.production.entity;

import com.orderaudit.product.entity.Product;
import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "production_runs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_number", nullable = false, unique = true, length = 30)
    private String runNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bom_id", nullable = false)
    private Bom bom;

    @Column(name = "batch_multiplier", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal batchMultiplier = BigDecimal.ONE;

    @Column(name = "planned_output", nullable = false, precision = 10, scale = 2)
    private BigDecimal plannedOutput;

    @Column(name = "actual_good_output", precision = 10, scale = 2)
    private BigDecimal actualGoodOutput;

    @Column(name = "damaged_output", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal damagedOutput = BigDecimal.ZERO;

    @Column(name = "wastage_quantity", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal wastageQuantity = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ProductionStatus status = ProductionStatus.PLANNED;

    @Column(name = "production_date", nullable = false)
    @Builder.Default
    private LocalDate productionDate = LocalDate.now();

    @Column(name = "labour_cost", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal labourCost = BigDecimal.ZERO;

    @Column(name = "gas_power_cost", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal gasPowerCost = BigDecimal.ZERO;

    @Column(name = "other_overhead_cost", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal otherOverheadCost = BigDecimal.ZERO;

    @Column(name = "total_material_cost", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalMaterialCost = BigDecimal.ZERO;

    @Column(name = "total_packaging_cost", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalPackagingCost = BigDecimal.ZERO;

    @Column(name = "total_production_cost", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalProductionCost = BigDecimal.ZERO;

    @Column(name = "cost_per_packet", precision = 12, scale = 4)
    @Builder.Default
    private BigDecimal costPerPacket = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    private User supervisor;

    @OneToMany(mappedBy = "productionRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductionMaterialIssue> materialIssues = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
`);

writeFile('production/entity/ProductionMaterialIssue.java', `
package com.orderaudit.production.entity;

import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_material_issues")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionMaterialIssue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_run_id", nullable = false)
    private ProductionRun productionRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(name = "planned_quantity", nullable = false, precision = 12, scale = 4)
    private BigDecimal plannedQuantity;

    @Column(name = "actual_quantity", nullable = false, precision = 12, scale = 4)
    private BigDecimal actualQuantity;

    @Column(name = "damaged_quantity", precision = 12, scale = 4)
    @Builder.Default
    private BigDecimal damagedQuantity = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnitOfMeasure unit;

    @Column(name = "unit_cost", precision = 12, scale = 4)
    @Builder.Default
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "total_cost", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Column(name = "variance_quantity", precision = 12, scale = 4)
    @Builder.Default
    private BigDecimal varianceQuantity = BigDecimal.ZERO;

    @Column(name = "variance_percentage", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal variancePercentage = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

// 6. Production Repositories
writeFile('production/repository/BomRepository.java', `
package com.orderaudit.production.repository;

import com.orderaudit.production.entity.Bom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BomRepository extends JpaRepository<Bom, Long> {
    Optional<Bom> findByProductIdAndActiveTrue(Long productId);
    Optional<Bom> findByProductIdAndVersion(Long productId, int version);
    List<Bom> findByActiveTrue();

    @Query("SELECT COALESCE(MAX(b.version), 0) FROM Bom b WHERE b.product.id = :productId")
    int findMaxVersionForProduct(@Param("productId") Long productId);
}
`);

writeFile('production/repository/BomItemRepository.java', `
package com.orderaudit.production.repository;

import com.orderaudit.production.entity.BomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BomItemRepository extends JpaRepository<BomItem, Long> {
    List<BomItem> findByBomId(Long bomId);
}
`);

writeFile('production/repository/ProductionRunRepository.java', `
package com.orderaudit.production.repository;

import com.orderaudit.production.entity.ProductionRun;
import com.orderaudit.production.entity.ProductionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionRunRepository extends JpaRepository<ProductionRun, Long> {
    Optional<ProductionRun> findByRunNumber(String runNumber);
    List<ProductionRun> findByProductIdOrderByProductionDateDesc(Long productId);
    List<ProductionRun> findByStatus(ProductionStatus status);
    List<ProductionRun> findByProductionDateBetweenOrderByProductionDateDesc(LocalDate from, LocalDate to);
    long countByProductionDate(LocalDate date);
}
`);

writeFile('production/repository/ProductionMaterialIssueRepository.java', `
package com.orderaudit.production.repository;

import com.orderaudit.production.entity.ProductionMaterialIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionMaterialIssueRepository extends JpaRepository<ProductionMaterialIssue, Long> {
    List<ProductionMaterialIssue> findByProductionRunId(Long runId);
}
`);

// 7. Production DTOs
writeFile('production/dto/BomItemDto.java', `
package com.orderaudit.production.dto;

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
public class BomItemDto {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemName;
    private ItemType itemType;
    private BigDecimal quantity;
    private UnitOfMeasure unit;
    private String notes;
}
`);

writeFile('production/dto/BomDto.java', `
package com.orderaudit.production.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
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
public class BomDto {
    private Long id;
    private Long productId;
    private String productName;
    private int version;
    private BigDecimal batchSize;
    private UnitOfMeasure batchUnit;
    private BigDecimal expectedOutput;
    private UnitOfMeasure outputUnit;
    private boolean active;
    private String notes;
    private List<BomItemDto> items;
}
`);

writeFile('production/dto/BomItemRequest.java', `
package com.orderaudit.production.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomItemRequest {
    @NotNull(message = "Inventory item is required")
    private Long inventoryItemId;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotNull(message = "Unit is required")
    private UnitOfMeasure unit;

    private String notes;
}
`);

writeFile('production/dto/CreateBomRequest.java', `
package com.orderaudit.production.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class CreateBomRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Batch size is required")
    private BigDecimal batchSize;

    private UnitOfMeasure batchUnit;

    @NotNull(message = "Expected output is required")
    private BigDecimal expectedOutput;

    private UnitOfMeasure outputUnit;
    private String notes;

    @NotEmpty(message = "At least one BOM item is required")
    @Valid
    private List<BomItemRequest> items;
}
`);

writeFile('production/dto/MaterialIssueRequest.java', `
package com.orderaudit.production.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialIssueRequest {
    @NotNull(message = "Inventory item is required")
    private Long inventoryItemId;

    @NotNull(message = "Actual quantity is required")
    private BigDecimal actualQuantity;

    private BigDecimal damagedQuantity;
}
`);

writeFile('production/dto/MaterialIssueDto.java', `
package com.orderaudit.production.dto;

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
public class MaterialIssueDto {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemName;
    private ItemType itemType;
    private BigDecimal plannedQuantity;
    private BigDecimal actualQuantity;
    private BigDecimal damagedQuantity;
    private UnitOfMeasure unit;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private BigDecimal varianceQuantity;
    private BigDecimal variancePercentage;
    private boolean withinTolerance;
}
`);

writeFile('production/dto/ProductionRunDto.java', `
package com.orderaudit.production.dto;

import com.orderaudit.production.entity.ProductionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionRunDto {
    private Long id;
    private String runNumber;
    private Long productId;
    private String productName;
    private Long bomId;
    private int bomVersion;
    private BigDecimal batchMultiplier;
    private BigDecimal plannedOutput;
    private BigDecimal actualGoodOutput;
    private BigDecimal damagedOutput;
    private BigDecimal wastageQuantity;
    private ProductionStatus status;
    private LocalDate productionDate;
    private BigDecimal labourCost;
    private BigDecimal gasPowerCost;
    private BigDecimal otherOverheadCost;
    private BigDecimal totalMaterialCost;
    private BigDecimal totalPackagingCost;
    private BigDecimal totalProductionCost;
    private BigDecimal costPerPacket;
    private BigDecimal yieldVariancePercentage;
    private String notes;
    private List<MaterialIssueDto> materialIssues;
}
`);

writeFile('production/dto/CreateProductionRunRequest.java', `
package com.orderaudit.production.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductionRunRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "BOM ID is required")
    private Long bomId;

    private BigDecimal batchMultiplier;

    @NotNull(message = "Actual good output is required")
    private BigDecimal actualGoodOutput;

    private BigDecimal damagedOutput;
    private BigDecimal wastageQuantity;

    private BigDecimal labourCost;
    private BigDecimal gasPowerCost;
    private BigDecimal otherOverheadCost;

    private LocalDate productionDate;
    private String notes;

    @NotEmpty(message = "Material issues are required")
    @Valid
    private List<MaterialIssueRequest> materialIssues;
}
`);

writeFile('production/dto/ProductionVarianceDto.java', `
package com.orderaudit.production.dto;

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
public class ProductionVarianceDto {
    private Long inventoryItemId;
    private String materialName;
    private ItemType itemType;
    private BigDecimal plannedQuantity;
    private BigDecimal actualQuantity;
    private UnitOfMeasure unit;
    private BigDecimal varianceQuantity;
    private BigDecimal variancePercentage;
    private boolean withinTolerance;
    private BigDecimal unitCost;
    private BigDecimal financialImpact;
}
`);

writeFile('production/dto/ProductionSummaryDto.java', `
package com.orderaudit.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionSummaryDto {
    private long totalRuns;
    private BigDecimal totalPlannedOutput;
    private BigDecimal totalActualOutput;
    private BigDecimal totalWastage;
    private BigDecimal totalDamaged;
    private BigDecimal avgYieldPercentage;
    private BigDecimal avgCostPerPacket;
}
`);

// 8. BomService and ProductionService - FLAGSHIP MODULE
writeFile('production/service/BomService.java', `
package com.orderaudit.production.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.dto.BomDto;
import com.orderaudit.production.dto.BomItemDto;
import com.orderaudit.production.dto.BomItemRequest;
import com.orderaudit.production.dto.CreateBomRequest;
import com.orderaudit.production.entity.Bom;
import com.orderaudit.production.entity.BomItem;
import com.orderaudit.production.repository.BomRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BomService {
    private final BomRepository bomRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final UserRepository userRepository;

    @Transactional
    public BomDto createBom(CreateBomRequest req, Long userId) {
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", req.getProductId()));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        // Deactivate previous active BOM for this product
        bomRepository.findByProductIdAndActiveTrue(product.getId()).ifPresent(oldBom -> {
            oldBom.setActive(false);
            bomRepository.save(oldBom);
        });

        int nextVersion = bomRepository.findMaxVersionForProduct(product.getId()) + 1;

        Bom bom = Bom.builder()
                .product(product)
                .version(nextVersion)
                .batchSize(req.getBatchSize())
                .batchUnit(req.getBatchUnit() != null ? req.getBatchUnit() : UnitOfMeasure.PACKET)
                .expectedOutput(req.getExpectedOutput())
                .outputUnit(req.getOutputUnit() != null ? req.getOutputUnit() : UnitOfMeasure.PACKET)
                .active(true)
                .notes(req.getNotes())
                .createdBy(user)
                .build();

        List<BomItem> items = new ArrayList<>();
        for (BomItemRequest itemReq : req.getItems()) {
            InventoryItem invItem = inventoryItemRepository.findById(itemReq.getInventoryItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemReq.getInventoryItemId()));

            items.add(BomItem.builder()
                    .bom(bom)
                    .inventoryItem(invItem)
                    .quantity(itemReq.getQuantity())
                    .unit(itemReq.getUnit())
                    .notes(itemReq.getNotes())
                    .build());
        }

        bom.setItems(items);
        Bom saved = bomRepository.save(bom);
        return toDto(saved);
    }

    public BomDto getBomById(Long id) {
        Bom bom = bomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BOM", "id", id));
        return toDto(bom);
    }

    public BomDto getActiveBomForProduct(Long productId) {
        Bom bom = bomRepository.findByProductIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Active BOM for Product", "productId", productId));
        return toDto(bom);
    }

    public List<BomDto> getAllActiveBoms() {
        return bomRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public BomDto toDto(Bom bom) {
        List<BomItemDto> items = bom.getItems() != null ? bom.getItems().stream().map(i ->
                BomItemDto.builder()
                        .id(i.getId())
                        .inventoryItemId(i.getInventoryItem().getId())
                        .inventoryItemName(i.getInventoryItem().getName())
                        .itemType(i.getInventoryItem().getItemType())
                        .quantity(i.getQuantity())
                        .unit(i.getUnit())
                        .notes(i.getNotes())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return BomDto.builder()
                .id(bom.getId())
                .productId(bom.getProduct().getId())
                .productName(bom.getProduct().getName())
                .version(bom.getVersion())
                .batchSize(bom.getBatchSize())
                .batchUnit(bom.getBatchUnit())
                .expectedOutput(bom.getExpectedOutput())
                .outputUnit(bom.getOutputUnit())
                .active(bom.isActive())
                .notes(bom.getNotes())
                .items(items)
                .build();
    }
}
`);

writeFile('production/service/ProductionService.java', `
package com.orderaudit.production.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.config.AppProperties;
import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.dto.*;
import com.orderaudit.production.entity.*;
import com.orderaudit.production.repository.BomRepository;
import com.orderaudit.production.repository.ProductionMaterialIssueRepository;
import com.orderaudit.production.repository.ProductionRunRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductionService {
    private final ProductionRunRepository productionRunRepository;
    private final ProductionMaterialIssueRepository issueRepository;
    private final BomRepository bomRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional
    public ProductionRunDto createAndCompleteProductionRun(CreateProductionRunRequest req, Long userId) {
        Bom bom = bomRepository.findById(req.getBomId())
                .orElseThrow(() -> new ResourceNotFoundException("BOM", "id", req.getBomId()));

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", req.getProductId()));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal multiplier = req.getBatchMultiplier() != null ? req.getBatchMultiplier() : BigDecimal.ONE;
        LocalDate prodDate = req.getProductionDate() != null ? req.getProductionDate() : LocalDate.now();

        BigDecimal plannedOutput = bom.getExpectedOutput().multiply(multiplier);
        String runNumber = generateRunNumber(prodDate);

        ProductionRun run = ProductionRun.builder()
                .runNumber(runNumber)
                .product(product)
                .bom(bom)
                .batchMultiplier(multiplier)
                .plannedOutput(plannedOutput)
                .actualGoodOutput(req.getActualGoodOutput())
                .damagedOutput(req.getDamagedOutput() != null ? req.getDamagedOutput() : BigDecimal.ZERO)
                .wastageQuantity(req.getWastageQuantity() != null ? req.getWastageQuantity() : BigDecimal.ZERO)
                .status(ProductionStatus.COMPLETED)
                .productionDate(prodDate)
                .labourCost(req.getLabourCost() != null ? req.getLabourCost() : BigDecimal.ZERO)
                .gasPowerCost(req.getGasPowerCost() != null ? req.getGasPowerCost() : BigDecimal.ZERO)
                .otherOverheadCost(req.getOtherOverheadCost() != null ? req.getOtherOverheadCost() : BigDecimal.ZERO)
                .notes(req.getNotes())
                .supervisor(user)
                .build();

        ProductionRun savedRun = productionRunRepository.save(run);

        // Map request issues by item ID
        Map<Long, MaterialIssueRequest> issueReqMap = req.getMaterialIssues().stream()
                .collect(Collectors.toMap(MaterialIssueRequest::getInventoryItemId, r -> r));

        BigDecimal totalMaterialCost = BigDecimal.ZERO;
        BigDecimal totalPackagingCost = BigDecimal.ZERO;
        List<ProductionMaterialIssue> issues = new ArrayList<>();

        for (BomItem bomItem : bom.getItems()) {
            InventoryItem invItem = bomItem.getInventoryItem();
            Long itemId = invItem.getId();

            MaterialIssueRequest issueReq = issueReqMap.get(itemId);
            if (issueReq == null) {
                throw new BusinessException("Missing material issue for item: " + invItem.getName());
            }

            BigDecimal plannedQty = bomItem.getQuantity().multiply(multiplier);
            BigDecimal actualQty = issueReq.getActualQuantity();
            BigDecimal damagedQty = issueReq.getDamagedQuantity() != null ? issueReq.getDamagedQuantity() : BigDecimal.ZERO;

            // Variance = Actual - Planned
            BigDecimal varianceQty = actualQty.subtract(plannedQty);
            BigDecimal variancePct = BigDecimal.ZERO;
            if (plannedQty.compareTo(BigDecimal.ZERO) > 0) {
                variancePct = varianceQty.divide(plannedQty, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            }

            // Weighted average rate from inventory ledger
            BigDecimal unitCost = inventoryService.getWeightedAverageRate(itemId);

            // Total quantity consumed = actual good production consumption + damaged
            BigDecimal totalConsumedQty = actualQty.add(damagedQty);
            BigDecimal itemTotalCost = totalConsumedQty.multiply(unitCost).setScale(2, RoundingMode.HALF_UP);

            if (invItem.getItemType() == ItemType.RAW_MATERIAL) {
                totalMaterialCost = totalMaterialCost.add(itemTotalCost);
            } else if (invItem.getItemType() == ItemType.PACKAGING_MATERIAL) {
                totalPackagingCost = totalPackagingCost.add(itemTotalCost);
            }

            ProductionMaterialIssue issue = ProductionMaterialIssue.builder()
                    .productionRun(savedRun)
                    .inventoryItem(invItem)
                    .plannedQuantity(plannedQty)
                    .actualQuantity(actualQty)
                    .damagedQuantity(damagedQty)
                    .unit(bomItem.getUnit())
                    .unitCost(unitCost)
                    .totalCost(itemTotalCost)
                    .varianceQuantity(varianceQty)
                    .variancePercentage(variancePct)
                    .build();

            issues.add(issue);

            // Record stock reduction in ledger:
            // 1. Production Issue (negative stock for actual good output consumed)
            inventoryService.recordProductionIssue(
                    itemId,
                    actualQty,
                    bomItem.getUnit(),
                    unitCost,
                    savedRun.getId(),
                    userId
            );

            // 2. Damaged material (negative stock for damaged items)
            if (damagedQty.compareTo(BigDecimal.ZERO) > 0) {
                inventoryService.recordDamaged(
                        itemId,
                        damagedQty,
                        bomItem.getUnit(),
                        unitCost,
                        savedRun.getId(),
                        userId
                );
            }
        }

        savedRun.setMaterialIssues(issues);
        savedRun.setTotalMaterialCost(totalMaterialCost);
        savedRun.setTotalPackagingCost(totalPackagingCost);

        // Total Production Cost = Material + Packaging + Labour + Gas/Power + Overheads
        BigDecimal totalCost = totalMaterialCost
                .add(totalPackagingCost)
                .add(savedRun.getLabourCost())
                .add(savedRun.getGasPowerCost())
                .add(savedRun.getOtherOverheadCost());

        savedRun.setTotalProductionCost(totalCost);

        // Cost per Good Packet = Total Cost / Actual Good Output
        BigDecimal costPerPacket = BigDecimal.ZERO;
        if (req.getActualGoodOutput().compareTo(BigDecimal.ZERO) > 0) {
            costPerPacket = totalCost.divide(req.getActualGoodOutput(), 4, RoundingMode.HALF_UP);
        }
        savedRun.setCostPerPacket(costPerPacket);

        savedRun = productionRunRepository.save(savedRun);

        // Record finished goods increase in stock ledger
        inventoryService.recordProductionOutput(
                product.getId(),
                req.getActualGoodOutput(),
                costPerPacket,
                savedRun.getId(),
                userId
        );

        return toDto(savedRun);
    }

    public ProductionRunDto getProductionRunById(Long id) {
        ProductionRun run = productionRunRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionRun", "id", id));
        return toDto(run);
    }

    public List<ProductionRunDto> getAllProductionRuns() {
        return productionRunRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductionRunDto> getProductionRunsByDateRange(LocalDate from, LocalDate to) {
        return productionRunRepository.findByProductionDateBetweenOrderByProductionDateDesc(from, to)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public ProductionSummaryDto getProductionSummary() {
        List<ProductionRun> runs = productionRunRepository.findAll();
        long count = runs.size();
        BigDecimal totalPlanned = BigDecimal.ZERO;
        BigDecimal totalActual = BigDecimal.ZERO;
        BigDecimal totalWastage = BigDecimal.ZERO;
        BigDecimal totalDamaged = BigDecimal.ZERO;
        BigDecimal sumCostPerPacket = BigDecimal.ZERO;

        for (ProductionRun r : runs) {
            totalPlanned = totalPlanned.add(r.getPlannedOutput() != null ? r.getPlannedOutput() : BigDecimal.ZERO);
            totalActual = totalActual.add(r.getActualGoodOutput() != null ? r.getActualGoodOutput() : BigDecimal.ZERO);
            totalWastage = totalWastage.add(r.getWastageQuantity() != null ? r.getWastageQuantity() : BigDecimal.ZERO);
            totalDamaged = totalDamaged.add(r.getDamagedOutput() != null ? r.getDamagedOutput() : BigDecimal.ZERO);
            sumCostPerPacket = sumCostPerPacket.add(r.getCostPerPacket() != null ? r.getCostPerPacket() : BigDecimal.ZERO);
        }

        BigDecimal avgYield = BigDecimal.ZERO;
        if (totalPlanned.compareTo(BigDecimal.ZERO) > 0) {
            avgYield = totalActual.divide(totalPlanned, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
        }

        BigDecimal avgCost = count > 0 ? sumCostPerPacket.divide(BigDecimal.valueOf(count), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return ProductionSummaryDto.builder()
                .totalRuns(count)
                .totalPlannedOutput(totalPlanned)
                .totalActualOutput(totalActual)
                .totalWastage(totalWastage)
                .totalDamaged(totalDamaged)
                .avgYieldPercentage(avgYield)
                .avgCostPerPacket(avgCost)
                .build();
    }

    public List<ProductionVarianceDto> getVarianceReport(Long runId) {
        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionRun", "id", runId));

        BigDecimal tolerance = appProperties.getProduction().getVarianceTolerance();

        return run.getMaterialIssues().stream().map(issue -> {
            boolean withinTol = issue.getVariancePercentage().abs().compareTo(tolerance) <= 0;
            BigDecimal finImpact = issue.getVarianceQuantity().multiply(issue.getUnitCost()).setScale(2, RoundingMode.HALF_UP);

            return ProductionVarianceDto.builder()
                    .inventoryItemId(issue.getInventoryItem().getId())
                    .materialName(issue.getInventoryItem().getName())
                    .itemType(issue.getInventoryItem().getItemType())
                    .plannedQuantity(issue.getPlannedQuantity())
                    .actualQuantity(issue.getActualQuantity())
                    .unit(issue.getUnit())
                    .varianceQuantity(issue.getVarianceQuantity())
                    .variancePercentage(issue.getVariancePercentage())
                    .withinTolerance(withinTol)
                    .unitCost(issue.getUnitCost())
                    .financialImpact(finImpact)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public ProductionRunDto updateOverheads(Long runId, BigDecimal labour, BigDecimal gasPower, BigDecimal other) {
        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionRun", "id", runId));

        if (labour != null) run.setLabourCost(labour);
        if (gasPower != null) run.setGasPowerCost(gasPower);
        if (other != null) run.setOtherOverheadCost(other);

        BigDecimal totalCost = run.getTotalMaterialCost()
                .add(run.getTotalPackagingCost())
                .add(run.getLabourCost())
                .add(run.getGasPowerCost())
                .add(run.getOtherOverheadCost());

        run.setTotalProductionCost(totalCost);

        if (run.getActualGoodOutput() != null && run.getActualGoodOutput().compareTo(BigDecimal.ZERO) > 0) {
            run.setCostPerPacket(totalCost.divide(run.getActualGoodOutput(), 4, RoundingMode.HALF_UP));
        }

        return toDto(productionRunRepository.save(run));
    }

    private String generateRunNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = productionRunRepository.countByProductionDate(date) + 1;
        return String.format("PR-%s-%03d", dateStr, count);
    }

    private ProductionRunDto toDto(ProductionRun run) {
        BigDecimal tolerance = appProperties.getProduction().getVarianceTolerance();

        List<MaterialIssueDto> issues = run.getMaterialIssues() != null ? run.getMaterialIssues().stream().map(i -> {
            boolean withinTol = i.getVariancePercentage().abs().compareTo(tolerance) <= 0;
            return MaterialIssueDto.builder()
                    .id(i.getId())
                    .inventoryItemId(i.getInventoryItem().getId())
                    .inventoryItemName(i.getInventoryItem().getName())
                    .itemType(i.getInventoryItem().getItemType())
                    .plannedQuantity(i.getPlannedQuantity())
                    .actualQuantity(i.getActualQuantity())
                    .damagedQuantity(i.getDamagedQuantity())
                    .unit(i.getUnit())
                    .unitCost(i.getUnitCost())
                    .totalCost(i.getTotalCost())
                    .varianceQuantity(i.getVarianceQuantity())
                    .variancePercentage(i.getVariancePercentage())
                    .withinTolerance(withinTol)
                    .build();
        }).collect(Collectors.toList()) : new ArrayList<>();

        // Yield variance = (actualGoodOutput - plannedOutput) / plannedOutput * 100
        BigDecimal yieldVar = BigDecimal.ZERO;
        if (run.getPlannedOutput() != null && run.getPlannedOutput().compareTo(BigDecimal.ZERO) > 0 && run.getActualGoodOutput() != null) {
            yieldVar = run.getActualGoodOutput().subtract(run.getPlannedOutput())
                    .divide(run.getPlannedOutput(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        return ProductionRunDto.builder()
                .id(run.getId())
                .runNumber(run.getRunNumber())
                .productId(run.getProduct().getId())
                .productName(run.getProduct().getName())
                .bomId(run.getBom().getId())
                .bomVersion(run.getBom().getVersion())
                .batchMultiplier(run.getBatchMultiplier())
                .plannedOutput(run.getPlannedOutput())
                .actualGoodOutput(run.getActualGoodOutput())
                .damagedOutput(run.getDamagedOutput())
                .wastageQuantity(run.getWastageQuantity())
                .status(run.getStatus())
                .productionDate(run.getProductionDate())
                .labourCost(run.getLabourCost())
                .gasPowerCost(run.getGasPowerCost())
                .otherOverheadCost(run.getOtherOverheadCost())
                .totalMaterialCost(run.getTotalMaterialCost())
                .totalPackagingCost(run.getTotalPackagingCost())
                .totalProductionCost(run.getTotalProductionCost())
                .costPerPacket(run.getCostPerPacket())
                .yieldVariancePercentage(yieldVar)
                .notes(run.getNotes())
                .materialIssues(issues)
                .build();
    }
}
`);

// 9. Controllers
writeFile('production/controller/BomController.java', `
package com.orderaudit.production.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.production.dto.BomDto;
import com.orderaudit.production.dto.CreateBomRequest;
import com.orderaudit.production.service.BomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boms")
@RequiredArgsConstructor
public class BomController {
    private final BomService bomService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR')")
    public ResponseEntity<ApiResponse<BomDto>> createBom(
            @Valid @RequestBody CreateBomRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("BOM created successfully", bomService.createBom(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BomDto>>> getAllActiveBoms() {
        return ResponseEntity.ok(ApiResponse.ok(bomService.getAllActiveBoms()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BomDto>> getBomById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bomService.getBomById(id)));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<BomDto>> getActiveBomForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(bomService.getActiveBomForProduct(productId)));
    }
}
`);

writeFile('production/controller/ProductionRunController.java', `
package com.orderaudit.production.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.production.dto.CreateProductionRunRequest;
import com.orderaudit.production.dto.ProductionRunDto;
import com.orderaudit.production.dto.ProductionSummaryDto;
import com.orderaudit.production.dto.ProductionVarianceDto;
import com.orderaudit.production.service.ProductionService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/production")
@RequiredArgsConstructor
public class ProductionRunController {
    private final ProductionService productionService;

    @PostMapping("/runs")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR')")
    public ResponseEntity<ApiResponse<ProductionRunDto>> createAndCompleteRun(
            @Valid @RequestBody CreateProductionRunRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Production run completed successfully",
                productionService.createAndCompleteProductionRun(req, userId)));
    }

    @GetMapping("/runs")
    public ResponseEntity<ApiResponse<List<ProductionRunDto>>> getAllRuns() {
        return ResponseEntity.ok(ApiResponse.ok(productionService.getAllProductionRuns()));
    }

    @GetMapping("/runs/{id}")
    public ResponseEntity<ApiResponse<ProductionRunDto>> getRunById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productionService.getProductionRunById(id)));
    }

    @GetMapping("/runs/{id}/variance")
    public ResponseEntity<ApiResponse<List<ProductionVarianceDto>>> getVarianceReport(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productionService.getVarianceReport(id)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ProductionSummaryDto>> getProductionSummary() {
        return ResponseEntity.ok(ApiResponse.ok(productionService.getProductionSummary()));
    }

    @PutMapping("/runs/{id}/overheads")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ProductionRunDto>> updateOverheads(
            @PathVariable Long id,
            @RequestBody OverheadsUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Overheads updated successfully",
                productionService.updateOverheads(id, req.getLabourCost(), req.getGasPowerCost(), req.getOtherOverheadCost())));
    }

    @Data
    public static class OverheadsUpdateRequest {
        private BigDecimal labourCost;
        private BigDecimal gasPowerCost;
        private BigDecimal otherOverheadCost;
    }
}
`);

console.log('Part 4 Purchases & Production generated successfully!');


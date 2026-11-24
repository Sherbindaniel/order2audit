const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../backend/src/main/java/com/orderaudit');

function writeFile(relPath, content) {
    const fullPath = path.join(BASE, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created:', relPath);
}

// 1. Enums
writeFile('inventory/entity/UnitOfMeasure.java', `
package com.orderaudit.inventory.entity;

public enum UnitOfMeasure {
    KG,
    G,
    L,
    ML,
    PIECE,
    PACKET,
    CARTON
}
`);

writeFile('inventory/entity/ItemType.java', `
package com.orderaudit.inventory.entity;

public enum ItemType {
    RAW_MATERIAL,
    PACKAGING_MATERIAL,
    FINISHED_GOOD
}
`);

writeFile('inventory/entity/MovementType.java', `
package com.orderaudit.inventory.entity;

public enum MovementType {
    OPENING_STOCK,
    PURCHASE_RECEIPT,
    PRODUCTION_ISSUE,
    PRODUCTION_OUTPUT,
    DISPATCH,
    RETURN,
    ADJUSTMENT,
    DAMAGED
}
`);

// 2. Product Category and Product Entities
writeFile('product/entity/ProductCategory.java', `
package com.orderaudit.product.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

writeFile('product/entity/Product.java', `
package com.orderaudit.product.entity;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, length = 50)
    private String sku;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ProductCategory category;

    @Column(name = "pack_size", nullable = false, precision = 10, scale = 2)
    private BigDecimal packSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "pack_unit", nullable = false, length = 20)
    @Builder.Default
    private UnitOfMeasure packUnit = UnitOfMeasure.G;

    @Column(name = "hsn_code", length = 20)
    @Builder.Default
    private String hsnCode = "2106";

    @Column(name = "gst_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal gstRate = new BigDecimal("5.00");

    @Column(name = "selling_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal sellingPrice;

    @Column(precision = 12, scale = 2)
    private BigDecimal mrp;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

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

// 3. Product Repositories
writeFile('product/repository/ProductCategoryRepository.java', `
package com.orderaudit.product.repository;

import com.orderaudit.product.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    Optional<ProductCategory> findByName(String name);
}
`);

writeFile('product/repository/ProductRepository.java', `
package com.orderaudit.product.repository;

import com.orderaudit.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrue();
    List<Product> findByCategoryId(Long categoryId);
    Optional<Product> findBySku(String sku);
    Optional<Product> findByName(String name);
}
`);

// 4. Product DTOs
writeFile('product/dto/ProductCategoryDto.java', `
package com.orderaudit.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategoryDto {
    private Long id;
    private String name;
    private String description;
}
`);

writeFile('product/dto/ProductDto.java', `
package com.orderaudit.product.dto;

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
public class ProductDto {
    private Long id;
    private String name;
    private String sku;
    private Long categoryId;
    private String categoryName;
    private BigDecimal packSize;
    private UnitOfMeasure packUnit;
    private String hsnCode;
    private BigDecimal gstRate;
    private BigDecimal sellingPrice;
    private BigDecimal mrp;
    private boolean active;
}
`);

writeFile('product/dto/CreateProductRequest.java', `
package com.orderaudit.product.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.validation.constraints.NotBlank;
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
public class CreateProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    private String sku;
    private Long categoryId;

    @NotNull(message = "Pack size is required")
    private BigDecimal packSize;

    @NotNull(message = "Pack unit is required")
    private UnitOfMeasure packUnit;

    private String hsnCode;
    private BigDecimal gstRate;

    @NotNull(message = "Selling price is required")
    private BigDecimal sellingPrice;

    private BigDecimal mrp;
}
`);

// 5. Product Service and Controller
writeFile('product/service/ProductService.java', `
package com.orderaudit.product.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.product.dto.CreateProductRequest;
import com.orderaudit.product.dto.ProductCategoryDto;
import com.orderaudit.product.dto.ProductDto;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.entity.ProductCategory;
import com.orderaudit.product.repository.ProductCategoryRepository;
import com.orderaudit.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;

    public List<ProductDto> getAllProducts() {
        return productRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public ProductDto getProductById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return toDto(p);
    }

    public List<ProductDto> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public ProductDto createProduct(CreateProductRequest request) {
        ProductCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", "id", request.getCategoryId()));
        }

        Product p = Product.builder()
                .name(request.getName())
                .sku(request.getSku() != null ? request.getSku() : generateSku(request.getName()))
                .category(category)
                .packSize(request.getPackSize())
                .packUnit(request.getPackUnit())
                .hsnCode(request.getHsnCode() != null ? request.getHsnCode() : "2106")
                .gstRate(request.getGstRate() != null ? request.getGstRate() : new BigDecimal("5.00"))
                .sellingPrice(request.getSellingPrice())
                .mrp(request.getMrp())
                .active(true)
                .build();

        return toDto(productRepository.save(p));
    }

    @Transactional
    public ProductDto updateProduct(Long id, CreateProductRequest request) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (request.getCategoryId() != null) {
            ProductCategory cat = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", "id", request.getCategoryId()));
            p.setCategory(cat);
        }

        p.setName(request.getName());
        if (request.getSku() != null) p.setSku(request.getSku());
        p.setPackSize(request.getPackSize());
        p.setPackUnit(request.getPackUnit());
        if (request.getHsnCode() != null) p.setHsnCode(request.getHsnCode());
        if (request.getGstRate() != null) p.setGstRate(request.getGstRate());
        p.setSellingPrice(request.getSellingPrice());
        p.setMrp(request.getMrp());

        return toDto(productRepository.save(p));
    }

    public List<ProductCategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream().map(c ->
                ProductCategoryDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public ProductCategoryDto createCategory(ProductCategoryDto dto) {
        ProductCategory c = ProductCategory.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
        ProductCategory saved = categoryRepository.save(c);
        return ProductCategoryDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .build();
    }

    public ProductDto toDto(Product p) {
        return ProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .packSize(p.getPackSize())
                .packUnit(p.getPackUnit())
                .hsnCode(p.getHsnCode())
                .gstRate(p.getGstRate())
                .sellingPrice(p.getSellingPrice())
                .mrp(p.getMrp())
                .active(p.isActive())
                .build();
    }

    private String generateSku(String name) {
        String clean = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (clean.length() > 6) clean = clean.substring(0, 6);
        return clean + "-" + System.currentTimeMillis() % 10000;
    }
}
`);

writeFile('product/controller/ProductController.java', `
package com.orderaudit.product.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.product.dto.CreateProductRequest;
import com.orderaudit.product.dto.ProductCategoryDto;
import com.orderaudit.product.dto.ProductDto;
import com.orderaudit.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> getAllProducts() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getAllProducts()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Product created successfully", productService.createProduct(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(@PathVariable Long id, @Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Product updated successfully", productService.updateProduct(id, request)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<ProductCategoryDto>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getAllCategories()));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductCategoryDto>> createCategory(@RequestBody ProductCategoryDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Category created successfully", productService.createCategory(dto)));
    }
}
`);

// 6. Inventory Items and Stock Movement Entities
writeFile('inventory/entity/InventoryItem.java', `
package com.orderaudit.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 50)
    private ItemType itemType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnitOfMeasure unit;

    @Column(name = "reorder_level", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal reorderLevel = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

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

writeFile('inventory/entity/StockMovement.java', `
package com.orderaudit.inventory.entity;

import com.orderaudit.product.entity.Product;
import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id")
    private InventoryItem inventoryItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 50)
    private MovementType movementType;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnitOfMeasure unit;

    @Column(name = "unit_cost", precision = 12, scale = 4)
    private BigDecimal unitCost;

    @Column(name = "total_cost", precision = 14, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "reference_number", length = 50)
    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (performedAt == null) performedAt = LocalDateTime.now();
        createdAt = LocalDateTime.now();
    }
}
`);

writeFile('inventory/entity/UnitConversion.java', `
package com.orderaudit.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "unit_conversions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"from_unit", "to_unit"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitConversion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_unit", nullable = false, length = 20)
    private UnitOfMeasure fromUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_unit", nullable = false, length = 20)
    private UnitOfMeasure toUnit;

    @Column(name = "conversion_factor", nullable = false, precision = 15, scale = 6)
    private BigDecimal conversionFactor;
}
`);

// 7. Inventory Repositories
writeFile('inventory/repository/InventoryItemRepository.java', `
package com.orderaudit.inventory.repository;

import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByItemType(ItemType itemType);
    List<InventoryItem> findByActiveTrue();
    Optional<InventoryItem> findByCode(String code);
    Optional<InventoryItem> findByName(String name);
}
`);

writeFile('inventory/repository/StockMovementRepository.java', `
package com.orderaudit.inventory.repository;

import com.orderaudit.inventory.entity.MovementType;
import com.orderaudit.inventory.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByInventoryItemIdOrderByPerformedAtAsc(Long inventoryItemId);
    List<StockMovement> findByProductIdOrderByPerformedAtAsc(Long productId);
    List<StockMovement> findBySourceTypeAndSourceId(String sourceType, Long sourceId);
    List<StockMovement> findByMovementType(MovementType movementType);

    @Query("SELECT COALESCE(SUM(sm.quantity), 0) FROM StockMovement sm WHERE sm.inventoryItem.id = :itemId")
    BigDecimal getStockBalance(@Param("itemId") Long itemId);

    @Query("SELECT COALESCE(SUM(sm.quantity), 0) FROM StockMovement sm WHERE sm.product.id = :productId")
    BigDecimal getProductStockBalance(@Param("productId") Long productId);

    List<StockMovement> findByInventoryItemIdAndPerformedAtBetweenOrderByPerformedAtAsc(
            Long itemId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.inventoryItem.id = :itemId AND sm.quantity > 0 AND sm.unitCost IS NOT NULL")
    List<StockMovement> findPositiveMovementsForItem(@Param("itemId") Long itemId);

    List<StockMovement> findByPerformedAtBetweenOrderByPerformedAtDesc(LocalDateTime from, LocalDateTime to);
}
`);

writeFile('inventory/repository/UnitConversionRepository.java', `
package com.orderaudit.inventory.repository;

import com.orderaudit.inventory.entity.UnitConversion;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UnitConversionRepository extends JpaRepository<UnitConversion, Long> {
    Optional<UnitConversion> findByFromUnitAndToUnit(UnitOfMeasure fromUnit, UnitOfMeasure toUnit);
}
`);

// 8. Inventory DTOs
writeFile('inventory/dto/InventoryItemDto.java', `
package com.orderaudit.inventory.dto;

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
public class InventoryItemDto {
    private Long id;
    private String name;
    private String code;
    private ItemType itemType;
    private UnitOfMeasure unit;
    private BigDecimal reorderLevel;
    private String description;
    private boolean active;
    private BigDecimal currentStock;
}
`);

writeFile('inventory/dto/CreateInventoryItemRequest.java', `
package com.orderaudit.inventory.dto;

import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.validation.constraints.NotBlank;
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
public class CreateInventoryItemRequest {
    @NotBlank(message = "Item name is required")
    private String name;

    private String code;

    @NotNull(message = "Item type is required")
    private ItemType itemType;

    @NotNull(message = "Unit of measure is required")
    private UnitOfMeasure unit;

    private BigDecimal reorderLevel;
    private String description;
}
`);

writeFile('inventory/dto/StockMovementDto.java', `
package com.orderaudit.inventory.dto;

import com.orderaudit.inventory.entity.MovementType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementDto {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemName;
    private Long productId;
    private String productName;
    private MovementType movementType;
    private BigDecimal quantity;
    private UnitOfMeasure unit;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String sourceType;
    private Long sourceId;
    private String referenceNumber;
    private String notes;
    private String performedByName;
    private LocalDateTime performedAt;
}
`);

writeFile('inventory/dto/StockBalanceDto.java', `
package com.orderaudit.inventory.dto;

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
public class StockBalanceDto {
    private Long id;
    private String name;
    private String code;
    private ItemType itemType;
    private UnitOfMeasure unit;
    private BigDecimal currentStock;
    private BigDecimal reorderLevel;
    private boolean lowStock;
    private boolean isProduct;
}
`);

writeFile('inventory/dto/StockLedgerEntryDto.java', `
package com.orderaudit.inventory.dto;

import com.orderaudit.inventory.entity.MovementType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLedgerEntryDto {
    private Long id;
    private LocalDateTime date;
    private MovementType movementType;
    private BigDecimal quantity;
    private UnitOfMeasure unit;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String sourceType;
    private String referenceNumber;
    private String notes;
    private BigDecimal runningBalance;
}
`);

// 9. UnitConversionService.java
writeFile('inventory/service/UnitConversionService.java', `
package com.orderaudit.inventory.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.inventory.entity.UnitConversion;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import com.orderaudit.inventory.repository.UnitConversionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class UnitConversionService {
    private final UnitConversionRepository unitConversionRepository;

    public BigDecimal convert(BigDecimal value, UnitOfMeasure fromUnit, UnitOfMeasure toUnit) {
        if (value == null) return BigDecimal.ZERO;
        if (fromUnit == toUnit) return value;

        UnitConversion conversion = unitConversionRepository.findByFromUnitAndToUnit(fromUnit, toUnit)
                .orElseThrow(() -> new BusinessException("Cannot convert from " + fromUnit + " to " + toUnit));

        return value.multiply(conversion.getConversionFactor()).setScale(4, RoundingMode.HALF_UP);
    }

    public boolean areCompatible(UnitOfMeasure a, UnitOfMeasure b) {
        if (a == b) return true;
        return unitConversionRepository.findByFromUnitAndToUnit(a, b).isPresent();
    }
}
`);

// 10. InventoryService.java - THE CENTRAL ENGINE
writeFile('inventory/service/InventoryService.java', `
package com.orderaudit.inventory.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.InsufficientStockException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.inventory.dto.*;
import com.orderaudit.inventory.entity.*;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.repository.StockMovementRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryItemRepository inventoryItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final UnitConversionService unitConversionService;

    public BigDecimal getCurrentStock(Long inventoryItemId) {
        BigDecimal balance = stockMovementRepository.getStockBalance(inventoryItemId);
        return balance != null ? balance : BigDecimal.ZERO;
    }

    public BigDecimal getCurrentProductStock(Long productId) {
        BigDecimal balance = stockMovementRepository.getProductStockBalance(productId);
        return balance != null ? balance : BigDecimal.ZERO;
    }

    @Transactional
    public StockMovement recordOpeningStock(Long itemId, BigDecimal quantity, UnitOfMeasure unit, BigDecimal unitCost, Long userId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (unitCost != null && quantity != null) ? quantity.multiply(unitCost) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .inventoryItem(item)
                .movementType(MovementType.OPENING_STOCK)
                .quantity(quantity)
                .unit(unit != null ? unit : item.getUnit())
                .unitCost(unitCost)
                .totalCost(totalCost)
                .sourceType("OPENING")
                .sourceId(itemId)
                .referenceNumber("OPENING-" + item.getCode())
                .notes("Opening stock balance")
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordProductOpeningStock(Long productId, BigDecimal quantity, BigDecimal unitCost, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (unitCost != null && quantity != null) ? quantity.multiply(unitCost) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(MovementType.OPENING_STOCK)
                .quantity(quantity)
                .unit(UnitOfMeasure.PACKET)
                .unitCost(unitCost)
                .totalCost(totalCost)
                .sourceType("OPENING")
                .sourceId(productId)
                .referenceNumber("OPENING-PRD-" + product.getId())
                .notes("Product opening stock")
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordPurchaseReceipt(Long itemId, BigDecimal qty, UnitOfMeasure unit, BigDecimal unitPrice, Long purchaseId, String refNum, Long userId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (qty != null && unitPrice != null) ? qty.multiply(unitPrice) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .inventoryItem(item)
                .movementType(MovementType.PURCHASE_RECEIPT)
                .quantity(qty)
                .unit(unit != null ? unit : item.getUnit())
                .unitCost(unitPrice)
                .totalCost(totalCost)
                .sourceType("PURCHASE")
                .sourceId(purchaseId)
                .referenceNumber(refNum)
                .notes("Purchase receipt " + refNum)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordProductionIssue(Long itemId, BigDecimal actualQty, UnitOfMeasure unit, BigDecimal unitCost, Long productionRunId, Long userId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));

        BigDecimal current = getCurrentStock(itemId);
        if (current.compareTo(actualQty) < 0) {
            throw new InsufficientStockException(item.getName(), current, actualQty);
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (actualQty != null && unitCost != null) ? actualQty.multiply(unitCost) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .inventoryItem(item)
                .movementType(MovementType.PRODUCTION_ISSUE)
                .quantity(actualQty.negate()) // STORED AS NEGATIVE
                .unit(unit != null ? unit : item.getUnit())
                .unitCost(unitCost)
                .totalCost(totalCost)
                .sourceType("PRODUCTION")
                .sourceId(productionRunId)
                .referenceNumber("PR-ISSUE-" + productionRunId)
                .notes("Material issued to production run " + productionRunId)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordProductionOutput(Long productId, BigDecimal actualGoodOutput, BigDecimal costPerPacket, Long productionRunId, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (actualGoodOutput != null && costPerPacket != null) ? actualGoodOutput.multiply(costPerPacket) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(MovementType.PRODUCTION_OUTPUT)
                .quantity(actualGoodOutput) // POSITIVE
                .unit(UnitOfMeasure.PACKET)
                .unitCost(costPerPacket)
                .totalCost(totalCost)
                .sourceType("PRODUCTION")
                .sourceId(productionRunId)
                .referenceNumber("PR-OUT-" + productionRunId)
                .notes("Finished goods output from production run " + productionRunId)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordDamaged(Long itemId, BigDecimal damagedQty, UnitOfMeasure unit, BigDecimal unitCost, Long productionRunId, Long userId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (damagedQty != null && unitCost != null) ? damagedQty.multiply(unitCost) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .inventoryItem(item)
                .movementType(MovementType.DAMAGED)
                .quantity(damagedQty.negate()) // NEGATIVE
                .unit(unit != null ? unit : item.getUnit())
                .unitCost(unitCost)
                .totalCost(totalCost)
                .sourceType("PRODUCTION")
                .sourceId(productionRunId)
                .referenceNumber("PR-DAMAGED-" + productionRunId)
                .notes("Damaged materials in production run " + productionRunId)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordDispatch(Long productId, BigDecimal quantity, Long dispatchId, String dispatchNumber, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        BigDecimal currentStock = getCurrentProductStock(productId);
        if (currentStock.compareTo(quantity) < 0) {
            throw new InsufficientStockException(product.getName(), currentStock, quantity);
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(MovementType.DISPATCH)
                .quantity(quantity.negate()) // NEGATIVE
                .unit(UnitOfMeasure.PACKET)
                .unitCost(product.getSellingPrice())
                .totalCost(quantity.multiply(product.getSellingPrice()))
                .sourceType("DISPATCH")
                .sourceId(dispatchId)
                .referenceNumber(dispatchNumber)
                .notes("Sales dispatch " + dispatchNumber)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    public BigDecimal getWeightedAverageRate(Long itemId) {
        List<StockMovement> positiveMovements = stockMovementRepository.findPositiveMovementsForItem(itemId);
        if (positiveMovements.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalQty = BigDecimal.ZERO;

        for (StockMovement sm : positiveMovements) {
            BigDecimal qty = sm.getQuantity();
            BigDecimal cost = sm.getUnitCost() != null ? sm.getUnitCost() : BigDecimal.ZERO;
            totalCost = totalCost.add(qty.multiply(cost));
            totalQty = totalQty.add(qty);
        }

        if (totalQty.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return totalCost.divide(totalQty, 4, RoundingMode.HALF_UP);
    }

    public List<StockBalanceDto> getAllStockBalances(ItemType typeFilter) {
        List<InventoryItem> items = typeFilter != null ?
                inventoryItemRepository.findByItemType(typeFilter) :
                inventoryItemRepository.findByActiveTrue();

        List<StockBalanceDto> list = new ArrayList<>();
        for (InventoryItem item : items) {
            BigDecimal stock = getCurrentStock(item.getId());
            boolean low = item.getReorderLevel() != null && stock.compareTo(item.getReorderLevel()) <= 0;
            list.add(StockBalanceDto.builder()
                    .id(item.getId())
                    .name(item.getName())
                    .code(item.getCode())
                    .itemType(item.getItemType())
                    .unit(item.getUnit())
                    .currentStock(stock)
                    .reorderLevel(item.getReorderLevel())
                    .lowStock(low)
                    .isProduct(false)
                    .build());
        }
        return list;
    }

    public List<StockBalanceDto> getProductStockBalances() {
        List<Product> products = productRepository.findByActiveTrue();
        List<StockBalanceDto> list = new ArrayList<>();
        for (Product p : products) {
            BigDecimal stock = getCurrentProductStock(p.getId());
            list.add(StockBalanceDto.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .code(p.getSku())
                    .itemType(ItemType.FINISHED_GOOD)
                    .unit(UnitOfMeasure.PACKET)
                    .currentStock(stock)
                    .reorderLevel(BigDecimal.ZERO)
                    .lowStock(false)
                    .isProduct(true)
                    .build());
        }
        return list;
    }

    public StockBalanceDto getStockBalance(Long itemId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));
        BigDecimal stock = getCurrentStock(itemId);
        boolean low = item.getReorderLevel() != null && stock.compareTo(item.getReorderLevel()) <= 0;
        return StockBalanceDto.builder()
                .id(item.getId())
                .name(item.getName())
                .code(item.getCode())
                .itemType(item.getItemType())
                .unit(item.getUnit())
                .currentStock(stock)
                .reorderLevel(item.getReorderLevel())
                .lowStock(low)
                .isProduct(false)
                .build();
    }

    public List<StockLedgerEntryDto> getStockLedger(Long itemId, LocalDateTime from, LocalDateTime to) {
        List<StockMovement> movements;
        if (from != null && to != null) {
            movements = stockMovementRepository.findByInventoryItemIdAndPerformedAtBetweenOrderByPerformedAtAsc(itemId, from, to);
        } else {
            movements = stockMovementRepository.findByInventoryItemIdOrderByPerformedAtAsc(itemId);
        }

        List<StockLedgerEntryDto> entries = new ArrayList<>();
        BigDecimal running = BigDecimal.ZERO;

        for (StockMovement sm : movements) {
            running = running.add(sm.getQuantity());
            entries.add(StockLedgerEntryDto.builder()
                    .id(sm.getId())
                    .date(sm.getPerformedAt())
                    .movementType(sm.getMovementType())
                    .quantity(sm.getQuantity())
                    .unit(sm.getUnit())
                    .unitCost(sm.getUnitCost())
                    .totalCost(sm.getTotalCost())
                    .sourceType(sm.getSourceType())
                    .referenceNumber(sm.getReferenceNumber())
                    .notes(sm.getNotes())
                    .runningBalance(running)
                    .build());
        }
        return entries;
    }

    public List<StockLedgerEntryDto> getProductStockLedger(Long productId) {
        List<StockMovement> movements = stockMovementRepository.findByProductIdOrderByPerformedAtAsc(productId);
        List<StockLedgerEntryDto> entries = new ArrayList<>();
        BigDecimal running = BigDecimal.ZERO;

        for (StockMovement sm : movements) {
            running = running.add(sm.getQuantity());
            entries.add(StockLedgerEntryDto.builder()
                    .id(sm.getId())
                    .date(sm.getPerformedAt())
                    .movementType(sm.getMovementType())
                    .quantity(sm.getQuantity())
                    .unit(sm.getUnit())
                    .unitCost(sm.getUnitCost())
                    .totalCost(sm.getTotalCost())
                    .sourceType(sm.getSourceType())
                    .referenceNumber(sm.getReferenceNumber())
                    .notes(sm.getNotes())
                    .runningBalance(running)
                    .build());
        }
        return entries;
    }

    public List<InventoryItemDto> getAllInventoryItems(ItemType filter) {
        List<InventoryItem> items = filter != null ?
                inventoryItemRepository.findByItemType(filter) :
                inventoryItemRepository.findByActiveTrue();

        return items.stream().map(this::toDto).collect(Collectors.toList());
    }

    public InventoryItemDto getInventoryItem(Long id) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", id));
        return toDto(item);
    }

    @Transactional
    public InventoryItemDto createInventoryItem(CreateInventoryItemRequest req) {
        String code = req.getCode() != null ? req.getCode() : generateItemCode(req.getName());
        InventoryItem item = InventoryItem.builder()
                .name(req.getName())
                .code(code)
                .itemType(req.getItemType())
                .unit(req.getUnit())
                .reorderLevel(req.getReorderLevel() != null ? req.getReorderLevel() : BigDecimal.ZERO)
                .description(req.getDescription())
                .active(true)
                .build();
        return toDto(inventoryItemRepository.save(item));
    }

    @Transactional
    public InventoryItemDto updateInventoryItem(Long id, CreateInventoryItemRequest req) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", id));
        item.setName(req.getName());
        if (req.getCode() != null) item.setCode(req.getCode());
        item.setItemType(req.getItemType());
        item.setUnit(req.getUnit());
        if (req.getReorderLevel() != null) item.setReorderLevel(req.getReorderLevel());
        item.setDescription(req.getDescription());
        return toDto(inventoryItemRepository.save(item));
    }

    public InventoryItemDto toDto(InventoryItem item) {
        return InventoryItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .code(item.getCode())
                .itemType(item.getItemType())
                .unit(item.getUnit())
                .reorderLevel(item.getReorderLevel())
                .description(item.getDescription())
                .active(item.isActive())
                .currentStock(getCurrentStock(item.getId()))
                .build();
    }

    private String generateItemCode(String name) {
        String clean = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (clean.length() > 4) clean = clean.substring(0, 4);
        return "ITM-" + clean + "-" + (System.currentTimeMillis() % 1000);
    }
}
`);

// 11. InventoryController.java
writeFile('inventory/controller/InventoryController.java', `
package com.orderaudit.inventory.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.inventory.dto.*;
import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import com.orderaudit.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<InventoryItemDto>>> getAllItems(@RequestParam(required = false) ItemType type) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getAllInventoryItems(type)));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<InventoryItemDto>> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getInventoryItem(id)));
    }

    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<InventoryItemDto>> createItem(@Valid @RequestBody CreateInventoryItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Item created successfully", inventoryService.createInventoryItem(req)));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<InventoryItemDto>> updateItem(@PathVariable Long id, @Valid @RequestBody CreateInventoryItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Item updated successfully", inventoryService.updateInventoryItem(id, req)));
    }

    @GetMapping("/stock")
    public ResponseEntity<ApiResponse<List<StockBalanceDto>>> getAllStock(@RequestParam(required = false) ItemType type) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getAllStockBalances(type)));
    }

    @GetMapping("/stock/{itemId}")
    public ResponseEntity<ApiResponse<StockBalanceDto>> getItemStock(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockBalance(itemId)));
    }

    @GetMapping("/stock/product/{productId}")
    public ResponseEntity<ApiResponse<BigDecimal>> getProductStock(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getCurrentProductStock(productId)));
    }

    @GetMapping("/stock/products")
    public ResponseEntity<ApiResponse<List<StockBalanceDto>>> getAllProductStock() {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getProductStockBalances()));
    }

    @GetMapping("/ledger/{itemId}")
    public ResponseEntity<ApiResponse<List<StockLedgerEntryDto>>> getStockLedger(
            @PathVariable Long itemId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockLedger(itemId, from, to)));
    }

    @GetMapping("/ledger/product/{productId}")
    public ResponseEntity<ApiResponse<List<StockLedgerEntryDto>>> getProductLedger(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getProductStockLedger(productId)));
    }

    @PostMapping("/opening-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<Void>> recordOpeningStock(@RequestBody OpeningStockRequest request) {
        inventoryService.recordOpeningStock(request.getItemId(), request.getQuantity(), request.getUnit(), request.getUnitCost(), null);
        return ResponseEntity.ok(ApiResponse.ok("Opening stock recorded", null));
    }

    @PostMapping("/opening-stock/product")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<Void>> recordProductOpeningStock(@RequestBody ProductOpeningStockRequest request) {
        inventoryService.recordProductOpeningStock(request.getProductId(), request.getQuantity(), request.getUnitCost(), null);
        return ResponseEntity.ok(ApiResponse.ok("Product opening stock recorded", null));
    }

    @Data
    public static class OpeningStockRequest {
        private Long itemId;
        private BigDecimal quantity;
        private UnitOfMeasure unit;
        private BigDecimal unitCost;
    }

    @Data
    public static class ProductOpeningStockRequest {
        private Long productId;
        private BigDecimal quantity;
        private BigDecimal unitCost;
    }
}
`);

// 12. Supplier Entity, Repo, DTO, Service, Controller
writeFile('supplier/entity/Supplier.java', `
package com.orderaudit.supplier.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 15)
    private String gstin;

    @Column(length = 50)
    private String state;

    @Column(name = "state_code", length = 2)
    private String stateCode;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

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

writeFile('supplier/repository/SupplierRepository.java', `
package com.orderaudit.supplier.repository;

import com.orderaudit.supplier.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByActiveTrue();
    Optional<Supplier> findByName(String name);
}
`);

writeFile('supplier/dto/SupplierDto.java', `
package com.orderaudit.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDto {
    private Long id;
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String gstin;
    private String state;
    private String stateCode;
    private boolean active;
}
`);

writeFile('supplier/dto/CreateSupplierRequest.java', `
package com.orderaudit.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupplierRequest {
    @NotBlank(message = "Supplier name is required")
    private String name;

    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String gstin;
    private String state;
    private String stateCode;
}
`);

writeFile('supplier/service/SupplierService.java', `
package com.orderaudit.supplier.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.supplier.dto.CreateSupplierRequest;
import com.orderaudit.supplier.dto.SupplierDto;
import com.orderaudit.supplier.entity.Supplier;
import com.orderaudit.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public SupplierDto getSupplierById(Long id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return toDto(s);
    }

    @Transactional
    public SupplierDto createSupplier(CreateSupplierRequest req) {
        Supplier s = Supplier.builder()
                .name(req.getName())
                .contactPerson(req.getContactPerson())
                .phone(req.getPhone())
                .email(req.getEmail())
                .address(req.getAddress())
                .gstin(req.getGstin())
                .state(req.getState())
                .stateCode(req.getStateCode())
                .active(true)
                .build();
        return toDto(supplierRepository.save(s));
    }

    @Transactional
    public SupplierDto updateSupplier(Long id, CreateSupplierRequest req) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        s.setName(req.getName());
        s.setContactPerson(req.getContactPerson());
        s.setPhone(req.getPhone());
        s.setEmail(req.getEmail());
        s.setAddress(req.getAddress());
        s.setGstin(req.getGstin());
        s.setState(req.getState());
        s.setStateCode(req.getStateCode());
        return toDto(supplierRepository.save(s));
    }

    public SupplierDto toDto(Supplier s) {
        return SupplierDto.builder()
                .id(s.getId())
                .name(s.getName())
                .contactPerson(s.getContactPerson())
                .phone(s.getPhone())
                .email(s.getEmail())
                .address(s.getAddress())
                .gstin(s.getGstin())
                .state(s.getState())
                .stateCode(s.getStateCode())
                .active(s.isActive())
                .build();
    }
}
`);

writeFile('supplier/controller/SupplierController.java', `
package com.orderaudit.supplier.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.supplier.dto.CreateSupplierRequest;
import com.orderaudit.supplier.dto.SupplierDto;
import com.orderaudit.supplier.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupplierDto>>> getAllSuppliers() {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getAllSuppliers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierDto>> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getSupplierById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<SupplierDto>> createSupplier(@Valid @RequestBody CreateSupplierRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Supplier created successfully", supplierService.createSupplier(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<SupplierDto>> updateSupplier(@PathVariable Long id, @Valid @RequestBody CreateSupplierRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Supplier updated successfully", supplierService.updateSupplier(id, req)));
    }
}
`);

console.log('Part 3 Inventory & Products generated successfully!');


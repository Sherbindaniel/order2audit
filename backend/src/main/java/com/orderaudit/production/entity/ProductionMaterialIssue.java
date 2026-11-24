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

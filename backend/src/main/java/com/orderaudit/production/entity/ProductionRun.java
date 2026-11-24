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

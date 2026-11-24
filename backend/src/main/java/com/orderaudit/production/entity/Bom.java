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

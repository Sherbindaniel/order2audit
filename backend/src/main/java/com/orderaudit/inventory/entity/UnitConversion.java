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

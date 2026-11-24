package com.orderaudit.reporting.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumptionVarianceEntryDto {
    private String runNumber;
    private LocalDate productionDate;
    private String productName;
    private String materialName;
    private BigDecimal plannedQuantity;
    private BigDecimal actualQuantity;
    private UnitOfMeasure unit;
    private BigDecimal varianceQuantity;
    private BigDecimal variancePercentage;
    private boolean withinTolerance;
    private BigDecimal financialImpact;
}

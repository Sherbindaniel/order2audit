package com.orderaudit.reporting.dto;

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
public class ProductionReportEntryDto {
    private String runNumber;
    private String productName;
    private LocalDate productionDate;
    private BigDecimal plannedOutput;
    private BigDecimal actualGoodOutput;
    private BigDecimal damagedOutput;
    private BigDecimal wastageQuantity;
    private BigDecimal yieldVariancePercentage;
    private BigDecimal totalProductionCost;
    private BigDecimal costPerPacket;
}

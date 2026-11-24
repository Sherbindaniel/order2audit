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

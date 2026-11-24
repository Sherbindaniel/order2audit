package com.orderaudit.reporting.dto;

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
public class ProductionDashboardDto {
    private long totalRuns;
    private BigDecimal totalGoodPackets;
    private BigDecimal avgYield;
    private BigDecimal totalWastage;
    private long varianceAlertsCount;
    private List<ProductionReportEntryDto> recentRuns;
}

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
public class OwnerDashboardDto {
    private long todayOrdersCount;
    private BigDecimal totalSalesAmount;
    private BigDecimal totalFgStockPackets;
    private long totalRawMaterialsCount;
    private long totalProductionRuns;
    private BigDecimal avgCostPerPacket;
    private BigDecimal totalOutstandingDues;
    private long lowStockAlertsCount;
    private List<SalesOrderSummary> recentOrders;
}

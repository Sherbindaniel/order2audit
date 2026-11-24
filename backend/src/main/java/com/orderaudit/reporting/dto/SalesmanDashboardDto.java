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
public class SalesmanDashboardDto {
    private long myOrdersCount;
    private long myCustomersCount;
    private BigDecimal thisMonthSales;
    private List<SalesOrderSummary> recentOrders;
}

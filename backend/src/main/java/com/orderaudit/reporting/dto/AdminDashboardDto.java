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
public class AdminDashboardDto {
    private long pendingOrdersApproval;
    private long todayInvoicesCount;
    private long todayDispatchesCount;
    private BigDecimal totalOutstanding;
    private List<SalesOrderSummary> pendingOrders;
}

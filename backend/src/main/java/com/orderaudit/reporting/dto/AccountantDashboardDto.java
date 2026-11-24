package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountantDashboardDto {
    private BigDecimal monthlySales;
    private BigDecimal monthlyPurchases;
    private BigDecimal totalTaxCollected;
    private BigDecimal totalPaymentsReceived;
    private BigDecimal totalOutstanding;
}

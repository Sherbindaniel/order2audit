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
public class CustomerSalesDto {
    private Long customerId;
    private String customerName;
    private String state;
    private int totalInvoices;
    private BigDecimal totalTaxableValue;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
    private BigDecimal totalPaid;
    private BigDecimal totalOutstanding;
}

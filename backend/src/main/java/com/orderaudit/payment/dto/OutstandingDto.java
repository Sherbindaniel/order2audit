package com.orderaudit.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingDto {
    private Long customerId;
    private String customerName;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private BigDecimal totalOutstanding;
    private BigDecimal bucket0_30;
    private BigDecimal bucket31_60;
    private BigDecimal bucket61_90;
    private BigDecimal bucketOver90;
}

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
public class PaymentAllocationDto {
    private Long id;
    private Long invoiceId;
    private String invoiceNumber;
    private BigDecimal allocatedAmount;
}

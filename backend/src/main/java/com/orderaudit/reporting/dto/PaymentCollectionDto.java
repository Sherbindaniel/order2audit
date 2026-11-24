package com.orderaudit.reporting.dto;

import com.orderaudit.payment.entity.PaymentMethod;
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
public class PaymentCollectionDto {
    private String paymentNumber;
    private LocalDate paymentDate;
    private String customerName;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
}

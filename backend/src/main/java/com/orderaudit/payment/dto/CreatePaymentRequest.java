package com.orderaudit.payment.dto;

import com.orderaudit.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Payment amount is required")
    private BigDecimal amount;

    private LocalDate paymentDate;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private String notes;

    private List<PaymentAllocationRequest> allocations;
}

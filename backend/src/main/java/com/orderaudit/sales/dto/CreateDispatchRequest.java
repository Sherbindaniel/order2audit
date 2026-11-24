package com.orderaudit.sales.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDispatchRequest {
    @NotNull(message = "Invoice ID is required")
    private Long invoiceId;

    private String notes;
}

package com.orderaudit.purchase.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseRequest {
    private Long supplierId;
    private LocalDate purchaseDate;
    private String notes;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<PurchaseItemRequest> items;
}

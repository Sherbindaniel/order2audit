package com.orderaudit.purchase.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseItemRequest {
    @NotNull(message = "Item ID is required")
    private Long inventoryItemId;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotNull(message = "Unit is required")
    private UnitOfMeasure unit;

    @NotNull(message = "Unit price is required")
    private BigDecimal unitPrice;
}

package com.orderaudit.production.dto;

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
public class BomItemRequest {
    @NotNull(message = "Inventory item is required")
    private Long inventoryItemId;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotNull(message = "Unit is required")
    private UnitOfMeasure unit;

    private String notes;
}

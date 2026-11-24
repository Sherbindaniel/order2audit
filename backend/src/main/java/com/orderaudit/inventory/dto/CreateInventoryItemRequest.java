package com.orderaudit.inventory.dto;

import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.validation.constraints.NotBlank;
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
public class CreateInventoryItemRequest {
    @NotBlank(message = "Item name is required")
    private String name;

    private String code;

    @NotNull(message = "Item type is required")
    private ItemType itemType;

    @NotNull(message = "Unit of measure is required")
    private UnitOfMeasure unit;

    private BigDecimal reorderLevel;
    private String description;
}

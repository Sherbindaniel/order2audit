package com.orderaudit.inventory.dto;

import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemDto {
    private Long id;
    private String name;
    private String code;
    private ItemType itemType;
    private UnitOfMeasure unit;
    private BigDecimal reorderLevel;
    private String description;
    private boolean active;
    private BigDecimal currentStock;
}

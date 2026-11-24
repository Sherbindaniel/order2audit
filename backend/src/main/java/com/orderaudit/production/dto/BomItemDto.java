package com.orderaudit.production.dto;

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
public class BomItemDto {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemName;
    private ItemType itemType;
    private BigDecimal quantity;
    private UnitOfMeasure unit;
    private String notes;
}

package com.orderaudit.purchase.dto;

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
public class PurchaseItemDto {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemName;
    private BigDecimal quantity;
    private UnitOfMeasure unit;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}

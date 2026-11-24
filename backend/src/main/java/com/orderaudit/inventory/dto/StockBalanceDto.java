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
public class StockBalanceDto {
    private Long id;
    private String name;
    private String code;
    private ItemType itemType;
    private UnitOfMeasure unit;
    private BigDecimal currentStock;
    private BigDecimal reorderLevel;
    private boolean lowStock;
    private boolean isProduct;
}

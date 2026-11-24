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
public class ProductionVarianceDto {
    private Long inventoryItemId;
    private String materialName;
    private ItemType itemType;
    private BigDecimal plannedQuantity;
    private BigDecimal actualQuantity;
    private UnitOfMeasure unit;
    private BigDecimal varianceQuantity;
    private BigDecimal variancePercentage;
    private boolean withinTolerance;
    private BigDecimal unitCost;
    private BigDecimal financialImpact;
}

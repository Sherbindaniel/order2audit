package com.orderaudit.inventory.dto;

import com.orderaudit.inventory.entity.MovementType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementDto {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemName;
    private Long productId;
    private String productName;
    private MovementType movementType;
    private BigDecimal quantity;
    private UnitOfMeasure unit;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String sourceType;
    private Long sourceId;
    private String referenceNumber;
    private String notes;
    private String performedByName;
    private LocalDateTime performedAt;
}

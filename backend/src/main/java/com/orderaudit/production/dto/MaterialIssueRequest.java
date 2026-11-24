package com.orderaudit.production.dto;

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
public class MaterialIssueRequest {
    @NotNull(message = "Inventory item is required")
    private Long inventoryItemId;

    @NotNull(message = "Actual quantity is required")
    private BigDecimal actualQuantity;

    private BigDecimal damagedQuantity;
}

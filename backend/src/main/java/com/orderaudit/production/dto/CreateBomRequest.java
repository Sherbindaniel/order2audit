package com.orderaudit.production.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBomRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Batch size is required")
    private BigDecimal batchSize;

    private UnitOfMeasure batchUnit;

    @NotNull(message = "Expected output is required")
    private BigDecimal expectedOutput;

    private UnitOfMeasure outputUnit;
    private String notes;

    @NotEmpty(message = "At least one BOM item is required")
    @Valid
    private List<BomItemRequest> items;
}

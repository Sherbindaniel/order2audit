package com.orderaudit.production.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductionRunRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "BOM ID is required")
    private Long bomId;

    private BigDecimal batchMultiplier;

    @NotNull(message = "Actual good output is required")
    private BigDecimal actualGoodOutput;

    private BigDecimal damagedOutput;
    private BigDecimal wastageQuantity;

    private BigDecimal labourCost;
    private BigDecimal gasPowerCost;
    private BigDecimal otherOverheadCost;

    private LocalDate productionDate;
    private String notes;

    @NotEmpty(message = "Material issues are required")
    @Valid
    private List<MaterialIssueRequest> materialIssues;
}

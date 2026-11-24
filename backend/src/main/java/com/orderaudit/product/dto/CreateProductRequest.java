package com.orderaudit.product.dto;

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
public class CreateProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    private String sku;
    private Long categoryId;

    @NotNull(message = "Pack size is required")
    private BigDecimal packSize;

    @NotNull(message = "Pack unit is required")
    private UnitOfMeasure packUnit;

    private String hsnCode;
    private BigDecimal gstRate;

    @NotNull(message = "Selling price is required")
    private BigDecimal sellingPrice;

    private BigDecimal mrp;
}

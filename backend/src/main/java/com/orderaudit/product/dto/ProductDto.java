package com.orderaudit.product.dto;

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
public class ProductDto {
    private Long id;
    private String name;
    private String sku;
    private Long categoryId;
    private String categoryName;
    private BigDecimal packSize;
    private UnitOfMeasure packUnit;
    private String hsnCode;
    private BigDecimal gstRate;
    private BigDecimal sellingPrice;
    private BigDecimal mrp;
    private boolean active;
}

package com.orderaudit.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSalesDto {
    private Long productId;
    private String productName;
    private String sku;
    private BigDecimal totalQuantity;
    private BigDecimal totalTaxableValue;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
}

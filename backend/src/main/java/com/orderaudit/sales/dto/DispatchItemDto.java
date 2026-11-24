package com.orderaudit.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal quantity;
}

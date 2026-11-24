package com.orderaudit.costing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarginReportDto {
    private Long productId;
    private String productName;
    private BigDecimal sellingPrice;
    private BigDecimal avgCostPerPacket;
    private BigDecimal grossMargin;
    private BigDecimal marginPercentage;
}

package com.orderaudit.reporting.dto;

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
public class StockSummaryDto {
    private Long itemId;
    private String itemName;
    private String code;
    private ItemType itemType;
    private UnitOfMeasure unit;
    private BigDecimal openingBalance;
    private BigDecimal totalReceipts;
    private BigDecimal totalIssues;
    private BigDecimal closingBalance;
}

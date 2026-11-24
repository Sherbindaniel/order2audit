package com.orderaudit.production.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
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
public class BomDto {
    private Long id;
    private Long productId;
    private String productName;
    private int version;
    private BigDecimal batchSize;
    private UnitOfMeasure batchUnit;
    private BigDecimal expectedOutput;
    private UnitOfMeasure outputUnit;
    private boolean active;
    private String notes;
    private List<BomItemDto> items;
}

package com.orderaudit.costing.dto;

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
public class CostingDto {
    private Long runId;
    private String runNumber;
    private String productName;
    private List<MaterialCostDto> rawMaterials;
    private List<MaterialCostDto> packagingMaterials;
    private BigDecimal totalMaterialCost;
    private BigDecimal totalPackagingCost;
    private BigDecimal labourCost;
    private BigDecimal gasPowerCost;
    private BigDecimal otherOverheadCost;
    private BigDecimal totalProductionCost;
    private BigDecimal actualGoodOutput;
    private BigDecimal costPerPacket;
    private BigDecimal sellingPrice;
    private BigDecimal grossMargin;
    private BigDecimal marginPercentage;
}

package com.orderaudit.production.dto;

import com.orderaudit.production.entity.ProductionStatus;
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
public class ProductionRunDto {
    private Long id;
    private String runNumber;
    private Long productId;
    private String productName;
    private Long bomId;
    private int bomVersion;
    private BigDecimal batchMultiplier;
    private BigDecimal plannedOutput;
    private BigDecimal actualGoodOutput;
    private BigDecimal damagedOutput;
    private BigDecimal wastageQuantity;
    private ProductionStatus status;
    private LocalDate productionDate;
    private BigDecimal labourCost;
    private BigDecimal gasPowerCost;
    private BigDecimal otherOverheadCost;
    private BigDecimal totalMaterialCost;
    private BigDecimal totalPackagingCost;
    private BigDecimal totalProductionCost;
    private BigDecimal costPerPacket;
    private BigDecimal yieldVariancePercentage;
    private String notes;
    private List<MaterialIssueDto> materialIssues;
}

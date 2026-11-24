package com.orderaudit.costing.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.costing.dto.CostingDto;
import com.orderaudit.costing.dto.MarginReportDto;
import com.orderaudit.costing.dto.MaterialCostDto;
import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.entity.ProductionMaterialIssue;
import com.orderaudit.production.entity.ProductionRun;
import com.orderaudit.production.repository.ProductionRunRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CostingService {
    private final ProductionRunRepository productionRunRepository;
    private final ProductRepository productRepository;

    public CostingDto getCostingForRun(Long productionRunId) {
        ProductionRun run = productionRunRepository.findById(productionRunId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionRun", "id", productionRunId));

        Product product = run.getProduct();
        List<MaterialCostDto> rawMaterials = new ArrayList<>();
        List<MaterialCostDto> packaging = new ArrayList<>();

        for (ProductionMaterialIssue issue : run.getMaterialIssues()) {
            BigDecimal totalConsumed = issue.getActualQuantity().add(issue.getDamagedQuantity() != null ? issue.getDamagedQuantity() : BigDecimal.ZERO);
            MaterialCostDto dto = MaterialCostDto.builder()
                    .materialName(issue.getInventoryItem().getName())
                    .quantity(totalConsumed)
                    .unit(issue.getUnit())
                    .unitCost(issue.getUnitCost())
                    .totalCost(issue.getTotalCost())
                    .build();

            if (issue.getInventoryItem().getItemType() == ItemType.RAW_MATERIAL) {
                rawMaterials.add(dto);
            } else {
                packaging.add(dto);
            }
        }

        BigDecimal sellingPrice = product.getSellingPrice();
        BigDecimal costPerPacket = run.getCostPerPacket() != null ? run.getCostPerPacket() : BigDecimal.ZERO;
        BigDecimal grossMargin = sellingPrice.subtract(costPerPacket);
        BigDecimal marginPct = BigDecimal.ZERO;
        if (sellingPrice.compareTo(BigDecimal.ZERO) > 0) {
            marginPct = grossMargin.divide(sellingPrice, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
        }

        return CostingDto.builder()
                .runId(run.getId())
                .runNumber(run.getRunNumber())
                .productName(product.getName())
                .rawMaterials(rawMaterials)
                .packagingMaterials(packaging)
                .totalMaterialCost(run.getTotalMaterialCost())
                .totalPackagingCost(run.getTotalPackagingCost())
                .labourCost(run.getLabourCost())
                .gasPowerCost(run.getGasPowerCost())
                .otherOverheadCost(run.getOtherOverheadCost())
                .totalProductionCost(run.getTotalProductionCost())
                .actualGoodOutput(run.getActualGoodOutput())
                .costPerPacket(costPerPacket)
                .sellingPrice(sellingPrice)
                .grossMargin(grossMargin)
                .marginPercentage(marginPct)
                .build();
    }

    public List<MarginReportDto> getMarginReport() {
        List<Product> products = productRepository.findByActiveTrue();
        List<MarginReportDto> report = new ArrayList<>();

        for (Product p : products) {
            List<ProductionRun> runs = productionRunRepository.findByProductIdOrderByProductionDateDesc(p.getId());

            BigDecimal totalCost = BigDecimal.ZERO;
            long runCount = 0;
            for (ProductionRun r : runs) {
                if (r.getCostPerPacket() != null && r.getCostPerPacket().compareTo(BigDecimal.ZERO) > 0) {
                    totalCost = totalCost.add(r.getCostPerPacket());
                    runCount++;
                }
            }

            BigDecimal avgCost = runCount > 0 ? totalCost.divide(BigDecimal.valueOf(runCount), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal margin = p.getSellingPrice().subtract(avgCost);
            BigDecimal marginPct = BigDecimal.ZERO;
            if (p.getSellingPrice().compareTo(BigDecimal.ZERO) > 0) {
                marginPct = margin.divide(p.getSellingPrice(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            }

            report.add(MarginReportDto.builder()
                    .productId(p.getId())
                    .productName(p.getName())
                    .sellingPrice(p.getSellingPrice())
                    .avgCostPerPacket(avgCost)
                    .grossMargin(margin)
                    .marginPercentage(marginPct)
                    .build());
        }

        return report;
    }
}

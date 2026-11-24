package com.orderaudit.production.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.config.AppProperties;
import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.dto.*;
import com.orderaudit.production.entity.*;
import com.orderaudit.production.repository.BomRepository;
import com.orderaudit.production.repository.ProductionMaterialIssueRepository;
import com.orderaudit.production.repository.ProductionRunRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductionService {
    private final ProductionRunRepository productionRunRepository;
    private final ProductionMaterialIssueRepository issueRepository;
    private final BomRepository bomRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional
    public ProductionRunDto createAndCompleteProductionRun(CreateProductionRunRequest req, Long userId) {
        Bom bom = bomRepository.findById(req.getBomId())
                .orElseThrow(() -> new ResourceNotFoundException("BOM", "id", req.getBomId()));

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", req.getProductId()));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal multiplier = req.getBatchMultiplier() != null ? req.getBatchMultiplier() : BigDecimal.ONE;
        LocalDate prodDate = req.getProductionDate() != null ? req.getProductionDate() : LocalDate.now();

        BigDecimal plannedOutput = bom.getExpectedOutput().multiply(multiplier);
        String runNumber = generateRunNumber(prodDate);

        ProductionRun run = ProductionRun.builder()
                .runNumber(runNumber)
                .product(product)
                .bom(bom)
                .batchMultiplier(multiplier)
                .plannedOutput(plannedOutput)
                .actualGoodOutput(req.getActualGoodOutput())
                .damagedOutput(req.getDamagedOutput() != null ? req.getDamagedOutput() : BigDecimal.ZERO)
                .wastageQuantity(req.getWastageQuantity() != null ? req.getWastageQuantity() : BigDecimal.ZERO)
                .status(ProductionStatus.COMPLETED)
                .productionDate(prodDate)
                .labourCost(req.getLabourCost() != null ? req.getLabourCost() : BigDecimal.ZERO)
                .gasPowerCost(req.getGasPowerCost() != null ? req.getGasPowerCost() : BigDecimal.ZERO)
                .otherOverheadCost(req.getOtherOverheadCost() != null ? req.getOtherOverheadCost() : BigDecimal.ZERO)
                .notes(req.getNotes())
                .supervisor(user)
                .build();

        ProductionRun savedRun = productionRunRepository.save(run);

        // Map request issues by item ID
        Map<Long, MaterialIssueRequest> issueReqMap = req.getMaterialIssues().stream()
                .collect(Collectors.toMap(MaterialIssueRequest::getInventoryItemId, r -> r));

        BigDecimal totalMaterialCost = BigDecimal.ZERO;
        BigDecimal totalPackagingCost = BigDecimal.ZERO;
        List<ProductionMaterialIssue> issues = new ArrayList<>();

        for (BomItem bomItem : bom.getItems()) {
            InventoryItem invItem = bomItem.getInventoryItem();
            Long itemId = invItem.getId();

            MaterialIssueRequest issueReq = issueReqMap.get(itemId);
            if (issueReq == null) {
                throw new BusinessException("Missing material issue for item: " + invItem.getName());
            }

            BigDecimal plannedQty = bomItem.getQuantity().multiply(multiplier);
            BigDecimal actualQty = issueReq.getActualQuantity();
            BigDecimal damagedQty = issueReq.getDamagedQuantity() != null ? issueReq.getDamagedQuantity() : BigDecimal.ZERO;

            // Variance = Actual - Planned
            BigDecimal varianceQty = actualQty.subtract(plannedQty);
            BigDecimal variancePct = BigDecimal.ZERO;
            if (plannedQty.compareTo(BigDecimal.ZERO) > 0) {
                variancePct = varianceQty.divide(plannedQty, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            }

            // Weighted average rate from inventory ledger
            BigDecimal unitCost = inventoryService.getWeightedAverageRate(itemId);

            // Total quantity consumed = actual good production consumption + damaged
            BigDecimal totalConsumedQty = actualQty.add(damagedQty);
            BigDecimal itemTotalCost = totalConsumedQty.multiply(unitCost).setScale(2, RoundingMode.HALF_UP);

            if (invItem.getItemType() == ItemType.RAW_MATERIAL) {
                totalMaterialCost = totalMaterialCost.add(itemTotalCost);
            } else if (invItem.getItemType() == ItemType.PACKAGING_MATERIAL) {
                totalPackagingCost = totalPackagingCost.add(itemTotalCost);
            }

            ProductionMaterialIssue issue = ProductionMaterialIssue.builder()
                    .productionRun(savedRun)
                    .inventoryItem(invItem)
                    .plannedQuantity(plannedQty)
                    .actualQuantity(actualQty)
                    .damagedQuantity(damagedQty)
                    .unit(bomItem.getUnit())
                    .unitCost(unitCost)
                    .totalCost(itemTotalCost)
                    .varianceQuantity(varianceQty)
                    .variancePercentage(variancePct)
                    .build();

            issues.add(issue);

            // Record stock reduction in ledger:
            // 1. Production Issue (negative stock for actual good output consumed)
            inventoryService.recordProductionIssue(
                    itemId,
                    actualQty,
                    bomItem.getUnit(),
                    unitCost,
                    savedRun.getId(),
                    userId
            );

            // 2. Damaged material (negative stock for damaged items)
            if (damagedQty.compareTo(BigDecimal.ZERO) > 0) {
                inventoryService.recordDamaged(
                        itemId,
                        damagedQty,
                        bomItem.getUnit(),
                        unitCost,
                        savedRun.getId(),
                        userId
                );
            }
        }

        savedRun.setMaterialIssues(issues);
        savedRun.setTotalMaterialCost(totalMaterialCost);
        savedRun.setTotalPackagingCost(totalPackagingCost);

        // Total Production Cost = Material + Packaging + Labour + Gas/Power + Overheads
        BigDecimal totalCost = totalMaterialCost
                .add(totalPackagingCost)
                .add(savedRun.getLabourCost())
                .add(savedRun.getGasPowerCost())
                .add(savedRun.getOtherOverheadCost());

        savedRun.setTotalProductionCost(totalCost);

        // Cost per Good Packet = Total Cost / Actual Good Output
        BigDecimal costPerPacket = BigDecimal.ZERO;
        if (req.getActualGoodOutput().compareTo(BigDecimal.ZERO) > 0) {
            costPerPacket = totalCost.divide(req.getActualGoodOutput(), 4, RoundingMode.HALF_UP);
        }
        savedRun.setCostPerPacket(costPerPacket);

        savedRun = productionRunRepository.save(savedRun);

        // Record finished goods increase in stock ledger
        inventoryService.recordProductionOutput(
                product.getId(),
                req.getActualGoodOutput(),
                costPerPacket,
                savedRun.getId(),
                userId
        );

        return toDto(savedRun);
    }

    public ProductionRunDto getProductionRunById(Long id) {
        ProductionRun run = productionRunRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionRun", "id", id));
        return toDto(run);
    }

    public List<ProductionRunDto> getAllProductionRuns() {
        return productionRunRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProductionRunDto> getProductionRunsByDateRange(LocalDate from, LocalDate to) {
        return productionRunRepository.findByProductionDateBetweenOrderByProductionDateDesc(from, to)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public ProductionSummaryDto getProductionSummary() {
        List<ProductionRun> runs = productionRunRepository.findAll();
        long count = runs.size();
        BigDecimal totalPlanned = BigDecimal.ZERO;
        BigDecimal totalActual = BigDecimal.ZERO;
        BigDecimal totalWastage = BigDecimal.ZERO;
        BigDecimal totalDamaged = BigDecimal.ZERO;
        BigDecimal sumCostPerPacket = BigDecimal.ZERO;

        for (ProductionRun r : runs) {
            totalPlanned = totalPlanned.add(r.getPlannedOutput() != null ? r.getPlannedOutput() : BigDecimal.ZERO);
            totalActual = totalActual.add(r.getActualGoodOutput() != null ? r.getActualGoodOutput() : BigDecimal.ZERO);
            totalWastage = totalWastage.add(r.getWastageQuantity() != null ? r.getWastageQuantity() : BigDecimal.ZERO);
            totalDamaged = totalDamaged.add(r.getDamagedOutput() != null ? r.getDamagedOutput() : BigDecimal.ZERO);
            sumCostPerPacket = sumCostPerPacket.add(r.getCostPerPacket() != null ? r.getCostPerPacket() : BigDecimal.ZERO);
        }

        BigDecimal avgYield = BigDecimal.ZERO;
        if (totalPlanned.compareTo(BigDecimal.ZERO) > 0) {
            avgYield = totalActual.divide(totalPlanned, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
        }

        BigDecimal avgCost = count > 0 ? sumCostPerPacket.divide(BigDecimal.valueOf(count), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return ProductionSummaryDto.builder()
                .totalRuns(count)
                .totalPlannedOutput(totalPlanned)
                .totalActualOutput(totalActual)
                .totalWastage(totalWastage)
                .totalDamaged(totalDamaged)
                .avgYieldPercentage(avgYield)
                .avgCostPerPacket(avgCost)
                .build();
    }

    public List<ProductionVarianceDto> getVarianceReport(Long runId) {
        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionRun", "id", runId));

        BigDecimal tolerance = appProperties.getProduction().getVarianceTolerance();

        return run.getMaterialIssues().stream().map(issue -> {
            boolean withinTol = issue.getVariancePercentage().abs().compareTo(tolerance) <= 0;
            BigDecimal finImpact = issue.getVarianceQuantity().multiply(issue.getUnitCost()).setScale(2, RoundingMode.HALF_UP);

            return ProductionVarianceDto.builder()
                    .inventoryItemId(issue.getInventoryItem().getId())
                    .materialName(issue.getInventoryItem().getName())
                    .itemType(issue.getInventoryItem().getItemType())
                    .plannedQuantity(issue.getPlannedQuantity())
                    .actualQuantity(issue.getActualQuantity())
                    .unit(issue.getUnit())
                    .varianceQuantity(issue.getVarianceQuantity())
                    .variancePercentage(issue.getVariancePercentage())
                    .withinTolerance(withinTol)
                    .unitCost(issue.getUnitCost())
                    .financialImpact(finImpact)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public ProductionRunDto updateOverheads(Long runId, BigDecimal labour, BigDecimal gasPower, BigDecimal other) {
        ProductionRun run = productionRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionRun", "id", runId));

        if (labour != null) run.setLabourCost(labour);
        if (gasPower != null) run.setGasPowerCost(gasPower);
        if (other != null) run.setOtherOverheadCost(other);

        BigDecimal totalCost = run.getTotalMaterialCost()
                .add(run.getTotalPackagingCost())
                .add(run.getLabourCost())
                .add(run.getGasPowerCost())
                .add(run.getOtherOverheadCost());

        run.setTotalProductionCost(totalCost);

        if (run.getActualGoodOutput() != null && run.getActualGoodOutput().compareTo(BigDecimal.ZERO) > 0) {
            run.setCostPerPacket(totalCost.divide(run.getActualGoodOutput(), 4, RoundingMode.HALF_UP));
        }

        return toDto(productionRunRepository.save(run));
    }

    private String generateRunNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = productionRunRepository.countByProductionDate(date) + 1;
        return String.format("PR-%s-%03d", dateStr, count);
    }

    private ProductionRunDto toDto(ProductionRun run) {
        BigDecimal tolerance = appProperties.getProduction().getVarianceTolerance();

        List<MaterialIssueDto> issues = run.getMaterialIssues() != null ? run.getMaterialIssues().stream().map(i -> {
            boolean withinTol = i.getVariancePercentage().abs().compareTo(tolerance) <= 0;
            return MaterialIssueDto.builder()
                    .id(i.getId())
                    .inventoryItemId(i.getInventoryItem().getId())
                    .inventoryItemName(i.getInventoryItem().getName())
                    .itemType(i.getInventoryItem().getItemType())
                    .plannedQuantity(i.getPlannedQuantity())
                    .actualQuantity(i.getActualQuantity())
                    .damagedQuantity(i.getDamagedQuantity())
                    .unit(i.getUnit())
                    .unitCost(i.getUnitCost())
                    .totalCost(i.getTotalCost())
                    .varianceQuantity(i.getVarianceQuantity())
                    .variancePercentage(i.getVariancePercentage())
                    .withinTolerance(withinTol)
                    .build();
        }).collect(Collectors.toList()) : new ArrayList<>();

        // Yield variance = (actualGoodOutput - plannedOutput) / plannedOutput * 100
        BigDecimal yieldVar = BigDecimal.ZERO;
        if (run.getPlannedOutput() != null && run.getPlannedOutput().compareTo(BigDecimal.ZERO) > 0 && run.getActualGoodOutput() != null) {
            yieldVar = run.getActualGoodOutput().subtract(run.getPlannedOutput())
                    .divide(run.getPlannedOutput(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        return ProductionRunDto.builder()
                .id(run.getId())
                .runNumber(run.getRunNumber())
                .productId(run.getProduct().getId())
                .productName(run.getProduct().getName())
                .bomId(run.getBom().getId())
                .bomVersion(run.getBom().getVersion())
                .batchMultiplier(run.getBatchMultiplier())
                .plannedOutput(run.getPlannedOutput())
                .actualGoodOutput(run.getActualGoodOutput())
                .damagedOutput(run.getDamagedOutput())
                .wastageQuantity(run.getWastageQuantity())
                .status(run.getStatus())
                .productionDate(run.getProductionDate())
                .labourCost(run.getLabourCost())
                .gasPowerCost(run.getGasPowerCost())
                .otherOverheadCost(run.getOtherOverheadCost())
                .totalMaterialCost(run.getTotalMaterialCost())
                .totalPackagingCost(run.getTotalPackagingCost())
                .totalProductionCost(run.getTotalProductionCost())
                .costPerPacket(run.getCostPerPacket())
                .yieldVariancePercentage(yieldVar)
                .notes(run.getNotes())
                .materialIssues(issues)
                .build();
    }
}

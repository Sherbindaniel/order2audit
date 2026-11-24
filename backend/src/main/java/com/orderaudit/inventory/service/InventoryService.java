package com.orderaudit.inventory.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.InsufficientStockException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.inventory.dto.*;
import com.orderaudit.inventory.entity.*;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.repository.StockMovementRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {
    private final InventoryItemRepository inventoryItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final UnitConversionService unitConversionService;

    public BigDecimal getCurrentStock(Long inventoryItemId) {
        BigDecimal balance = stockMovementRepository.getStockBalance(inventoryItemId);
        return balance != null ? balance : BigDecimal.ZERO;
    }

    public BigDecimal getCurrentProductStock(Long productId) {
        BigDecimal balance = stockMovementRepository.getProductStockBalance(productId);
        return balance != null ? balance : BigDecimal.ZERO;
    }

    @Transactional
    public StockMovement recordOpeningStock(Long itemId, BigDecimal quantity, UnitOfMeasure unit, BigDecimal unitCost, Long userId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (unitCost != null && quantity != null) ? quantity.multiply(unitCost) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .inventoryItem(item)
                .movementType(MovementType.OPENING_STOCK)
                .quantity(quantity)
                .unit(unit != null ? unit : item.getUnit())
                .unitCost(unitCost)
                .totalCost(totalCost)
                .sourceType("OPENING")
                .sourceId(itemId)
                .referenceNumber("OPENING-" + item.getCode())
                .notes("Opening stock balance")
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordProductOpeningStock(Long productId, BigDecimal quantity, BigDecimal unitCost, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (unitCost != null && quantity != null) ? quantity.multiply(unitCost) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(MovementType.OPENING_STOCK)
                .quantity(quantity)
                .unit(UnitOfMeasure.PACKET)
                .unitCost(unitCost)
                .totalCost(totalCost)
                .sourceType("OPENING")
                .sourceId(productId)
                .referenceNumber("OPENING-PRD-" + product.getId())
                .notes("Product opening stock")
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordPurchaseReceipt(Long itemId, BigDecimal qty, UnitOfMeasure unit, BigDecimal unitPrice, Long purchaseId, String refNum, Long userId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (qty != null && unitPrice != null) ? qty.multiply(unitPrice) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .inventoryItem(item)
                .movementType(MovementType.PURCHASE_RECEIPT)
                .quantity(qty)
                .unit(unit != null ? unit : item.getUnit())
                .unitCost(unitPrice)
                .totalCost(totalCost)
                .sourceType("PURCHASE")
                .sourceId(purchaseId)
                .referenceNumber(refNum)
                .notes("Purchase receipt " + refNum)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordProductionIssue(Long itemId, BigDecimal actualQty, UnitOfMeasure unit, BigDecimal unitCost, Long productionRunId, Long userId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));

        BigDecimal current = getCurrentStock(itemId);
        if (current.compareTo(actualQty) < 0) {
            throw new InsufficientStockException(item.getName(), current, actualQty);
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (actualQty != null && unitCost != null) ? actualQty.multiply(unitCost) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .inventoryItem(item)
                .movementType(MovementType.PRODUCTION_ISSUE)
                .quantity(actualQty.negate()) // STORED AS NEGATIVE
                .unit(unit != null ? unit : item.getUnit())
                .unitCost(unitCost)
                .totalCost(totalCost)
                .sourceType("PRODUCTION")
                .sourceId(productionRunId)
                .referenceNumber("PR-ISSUE-" + productionRunId)
                .notes("Material issued to production run " + productionRunId)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordProductionOutput(Long productId, BigDecimal actualGoodOutput, BigDecimal costPerPacket, Long productionRunId, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (actualGoodOutput != null && costPerPacket != null) ? actualGoodOutput.multiply(costPerPacket) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(MovementType.PRODUCTION_OUTPUT)
                .quantity(actualGoodOutput) // POSITIVE
                .unit(UnitOfMeasure.PACKET)
                .unitCost(costPerPacket)
                .totalCost(totalCost)
                .sourceType("PRODUCTION")
                .sourceId(productionRunId)
                .referenceNumber("PR-OUT-" + productionRunId)
                .notes("Finished goods output from production run " + productionRunId)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordDamaged(Long itemId, BigDecimal damagedQty, UnitOfMeasure unit, BigDecimal unitCost, Long productionRunId, Long userId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        BigDecimal totalCost = (damagedQty != null && unitCost != null) ? damagedQty.multiply(unitCost) : BigDecimal.ZERO;

        StockMovement movement = StockMovement.builder()
                .inventoryItem(item)
                .movementType(MovementType.DAMAGED)
                .quantity(damagedQty.negate()) // NEGATIVE
                .unit(unit != null ? unit : item.getUnit())
                .unitCost(unitCost)
                .totalCost(totalCost)
                .sourceType("PRODUCTION")
                .sourceId(productionRunId)
                .referenceNumber("PR-DAMAGED-" + productionRunId)
                .notes("Damaged materials in production run " + productionRunId)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    @Transactional
    public StockMovement recordDispatch(Long productId, BigDecimal quantity, Long dispatchId, String dispatchNumber, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        BigDecimal currentStock = getCurrentProductStock(productId);
        if (currentStock.compareTo(quantity) < 0) {
            throw new InsufficientStockException(product.getName(), currentStock, quantity);
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(MovementType.DISPATCH)
                .quantity(quantity.negate()) // NEGATIVE
                .unit(UnitOfMeasure.PACKET)
                .unitCost(product.getSellingPrice())
                .totalCost(quantity.multiply(product.getSellingPrice()))
                .sourceType("DISPATCH")
                .sourceId(dispatchId)
                .referenceNumber(dispatchNumber)
                .notes("Sales dispatch " + dispatchNumber)
                .performedBy(user)
                .performedAt(LocalDateTime.now())
                .build();

        return stockMovementRepository.save(movement);
    }

    public BigDecimal getWeightedAverageRate(Long itemId) {
        List<StockMovement> positiveMovements = stockMovementRepository.findPositiveMovementsForItem(itemId);
        if (positiveMovements.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalQty = BigDecimal.ZERO;

        for (StockMovement sm : positiveMovements) {
            BigDecimal qty = sm.getQuantity();
            BigDecimal cost = sm.getUnitCost() != null ? sm.getUnitCost() : BigDecimal.ZERO;
            totalCost = totalCost.add(qty.multiply(cost));
            totalQty = totalQty.add(qty);
        }

        if (totalQty.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return totalCost.divide(totalQty, 4, RoundingMode.HALF_UP);
    }

    public List<StockBalanceDto> getAllStockBalances(ItemType typeFilter) {
        List<InventoryItem> items = typeFilter != null ?
                inventoryItemRepository.findByItemType(typeFilter) :
                inventoryItemRepository.findByActiveTrue();

        List<StockBalanceDto> list = new ArrayList<>();
        for (InventoryItem item : items) {
            BigDecimal stock = getCurrentStock(item.getId());
            boolean low = item.getReorderLevel() != null && stock.compareTo(item.getReorderLevel()) <= 0;
            list.add(StockBalanceDto.builder()
                    .id(item.getId())
                    .name(item.getName())
                    .code(item.getCode())
                    .itemType(item.getItemType())
                    .unit(item.getUnit())
                    .currentStock(stock)
                    .reorderLevel(item.getReorderLevel())
                    .lowStock(low)
                    .isProduct(false)
                    .build());
        }
        return list;
    }

    public List<StockBalanceDto> getProductStockBalances() {
        List<Product> products = productRepository.findByActiveTrue();
        List<StockBalanceDto> list = new ArrayList<>();
        for (Product p : products) {
            BigDecimal stock = getCurrentProductStock(p.getId());
            list.add(StockBalanceDto.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .code(p.getSku())
                    .itemType(ItemType.FINISHED_GOOD)
                    .unit(UnitOfMeasure.PACKET)
                    .currentStock(stock)
                    .reorderLevel(BigDecimal.ZERO)
                    .lowStock(false)
                    .isProduct(true)
                    .build());
        }
        return list;
    }

    public StockBalanceDto getStockBalance(Long itemId) {
        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemId));
        BigDecimal stock = getCurrentStock(itemId);
        boolean low = item.getReorderLevel() != null && stock.compareTo(item.getReorderLevel()) <= 0;
        return StockBalanceDto.builder()
                .id(item.getId())
                .name(item.getName())
                .code(item.getCode())
                .itemType(item.getItemType())
                .unit(item.getUnit())
                .currentStock(stock)
                .reorderLevel(item.getReorderLevel())
                .lowStock(low)
                .isProduct(false)
                .build();
    }

    public List<StockLedgerEntryDto> getStockLedger(Long itemId, LocalDateTime from, LocalDateTime to) {
        List<StockMovement> movements;
        if (from != null && to != null) {
            movements = stockMovementRepository.findByInventoryItemIdAndPerformedAtBetweenOrderByPerformedAtAsc(itemId, from, to);
        } else {
            movements = stockMovementRepository.findByInventoryItemIdOrderByPerformedAtAsc(itemId);
        }

        List<StockLedgerEntryDto> entries = new ArrayList<>();
        BigDecimal running = BigDecimal.ZERO;

        for (StockMovement sm : movements) {
            running = running.add(sm.getQuantity());
            entries.add(StockLedgerEntryDto.builder()
                    .id(sm.getId())
                    .date(sm.getPerformedAt())
                    .movementType(sm.getMovementType())
                    .quantity(sm.getQuantity())
                    .unit(sm.getUnit())
                    .unitCost(sm.getUnitCost())
                    .totalCost(sm.getTotalCost())
                    .sourceType(sm.getSourceType())
                    .referenceNumber(sm.getReferenceNumber())
                    .notes(sm.getNotes())
                    .runningBalance(running)
                    .build());
        }
        return entries;
    }

    public List<StockLedgerEntryDto> getProductStockLedger(Long productId) {
        List<StockMovement> movements = stockMovementRepository.findByProductIdOrderByPerformedAtAsc(productId);
        List<StockLedgerEntryDto> entries = new ArrayList<>();
        BigDecimal running = BigDecimal.ZERO;

        for (StockMovement sm : movements) {
            running = running.add(sm.getQuantity());
            entries.add(StockLedgerEntryDto.builder()
                    .id(sm.getId())
                    .date(sm.getPerformedAt())
                    .movementType(sm.getMovementType())
                    .quantity(sm.getQuantity())
                    .unit(sm.getUnit())
                    .unitCost(sm.getUnitCost())
                    .totalCost(sm.getTotalCost())
                    .sourceType(sm.getSourceType())
                    .referenceNumber(sm.getReferenceNumber())
                    .notes(sm.getNotes())
                    .runningBalance(running)
                    .build());
        }
        return entries;
    }

    public List<InventoryItemDto> getAllInventoryItems(ItemType filter) {
        List<InventoryItem> items = filter != null ?
                inventoryItemRepository.findByItemType(filter) :
                inventoryItemRepository.findByActiveTrue();

        return items.stream().map(this::toDto).collect(Collectors.toList());
    }

    public InventoryItemDto getInventoryItem(Long id) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", id));
        return toDto(item);
    }

    @Transactional
    public InventoryItemDto createInventoryItem(CreateInventoryItemRequest req) {
        String code = req.getCode() != null ? req.getCode() : generateItemCode(req.getName());
        InventoryItem item = InventoryItem.builder()
                .name(req.getName())
                .code(code)
                .itemType(req.getItemType())
                .unit(req.getUnit())
                .reorderLevel(req.getReorderLevel() != null ? req.getReorderLevel() : BigDecimal.ZERO)
                .description(req.getDescription())
                .active(true)
                .build();
        return toDto(inventoryItemRepository.save(item));
    }

    @Transactional
    public InventoryItemDto updateInventoryItem(Long id, CreateInventoryItemRequest req) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", id));
        item.setName(req.getName());
        if (req.getCode() != null) item.setCode(req.getCode());
        item.setItemType(req.getItemType());
        item.setUnit(req.getUnit());
        if (req.getReorderLevel() != null) item.setReorderLevel(req.getReorderLevel());
        item.setDescription(req.getDescription());
        return toDto(inventoryItemRepository.save(item));
    }

    public InventoryItemDto toDto(InventoryItem item) {
        return InventoryItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .code(item.getCode())
                .itemType(item.getItemType())
                .unit(item.getUnit())
                .reorderLevel(item.getReorderLevel())
                .description(item.getDescription())
                .active(item.isActive())
                .currentStock(getCurrentStock(item.getId()))
                .build();
    }

    private String generateItemCode(String name) {
        String clean = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (clean.length() > 4) clean = clean.substring(0, 4);
        return "ITM-" + clean + "-" + (System.currentTimeMillis() % 1000);
    }
}

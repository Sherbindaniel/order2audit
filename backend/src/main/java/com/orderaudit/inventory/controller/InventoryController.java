package com.orderaudit.inventory.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.inventory.dto.*;
import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import com.orderaudit.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<InventoryItemDto>>> getAllItems(@RequestParam(required = false) ItemType type) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getAllInventoryItems(type)));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<InventoryItemDto>> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getInventoryItem(id)));
    }

    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<InventoryItemDto>> createItem(@Valid @RequestBody CreateInventoryItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Item created successfully", inventoryService.createInventoryItem(req)));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<InventoryItemDto>> updateItem(@PathVariable Long id, @Valid @RequestBody CreateInventoryItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Item updated successfully", inventoryService.updateInventoryItem(id, req)));
    }

    @GetMapping("/stock")
    public ResponseEntity<ApiResponse<List<StockBalanceDto>>> getAllStock(@RequestParam(required = false) ItemType type) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getAllStockBalances(type)));
    }

    @GetMapping("/stock/{itemId}")
    public ResponseEntity<ApiResponse<StockBalanceDto>> getItemStock(@PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockBalance(itemId)));
    }

    @GetMapping("/stock/product/{productId}")
    public ResponseEntity<ApiResponse<BigDecimal>> getProductStock(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getCurrentProductStock(productId)));
    }

    @GetMapping("/stock/products")
    public ResponseEntity<ApiResponse<List<StockBalanceDto>>> getAllProductStock() {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getProductStockBalances()));
    }

    @GetMapping("/ledger/{itemId}")
    public ResponseEntity<ApiResponse<List<StockLedgerEntryDto>>> getStockLedger(
            @PathVariable Long itemId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockLedger(itemId, from, to)));
    }

    @GetMapping("/ledger/product/{productId}")
    public ResponseEntity<ApiResponse<List<StockLedgerEntryDto>>> getProductLedger(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getProductStockLedger(productId)));
    }

    @PostMapping("/opening-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<Void>> recordOpeningStock(@RequestBody OpeningStockRequest request) {
        inventoryService.recordOpeningStock(request.getItemId(), request.getQuantity(), request.getUnit(), request.getUnitCost(), null);
        return ResponseEntity.ok(ApiResponse.ok("Opening stock recorded", null));
    }

    @PostMapping("/opening-stock/product")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<Void>> recordProductOpeningStock(@RequestBody ProductOpeningStockRequest request) {
        inventoryService.recordProductOpeningStock(request.getProductId(), request.getQuantity(), request.getUnitCost(), null);
        return ResponseEntity.ok(ApiResponse.ok("Product opening stock recorded", null));
    }

    @Data
    public static class OpeningStockRequest {
        private Long itemId;
        private BigDecimal quantity;
        private UnitOfMeasure unit;
        private BigDecimal unitCost;
    }

    @Data
    public static class ProductOpeningStockRequest {
        private Long productId;
        private BigDecimal quantity;
        private BigDecimal unitCost;
    }
}

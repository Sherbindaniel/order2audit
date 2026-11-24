package com.orderaudit.production.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.production.dto.CreateProductionRunRequest;
import com.orderaudit.production.dto.ProductionRunDto;
import com.orderaudit.production.dto.ProductionSummaryDto;
import com.orderaudit.production.dto.ProductionVarianceDto;
import com.orderaudit.production.service.ProductionService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/production")
@RequiredArgsConstructor
public class ProductionRunController {
    private final ProductionService productionService;

    @PostMapping("/runs")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR')")
    public ResponseEntity<ApiResponse<ProductionRunDto>> createAndCompleteRun(
            @Valid @RequestBody CreateProductionRunRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Production run completed successfully",
                productionService.createAndCompleteProductionRun(req, userId)));
    }

    @GetMapping("/runs")
    public ResponseEntity<ApiResponse<List<ProductionRunDto>>> getAllRuns() {
        return ResponseEntity.ok(ApiResponse.ok(productionService.getAllProductionRuns()));
    }

    @GetMapping("/runs/{id}")
    public ResponseEntity<ApiResponse<ProductionRunDto>> getRunById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productionService.getProductionRunById(id)));
    }

    @GetMapping("/runs/{id}/variance")
    public ResponseEntity<ApiResponse<List<ProductionVarianceDto>>> getVarianceReport(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productionService.getVarianceReport(id)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ProductionSummaryDto>> getProductionSummary() {
        return ResponseEntity.ok(ApiResponse.ok(productionService.getProductionSummary()));
    }

    @PutMapping("/runs/{id}/overheads")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ProductionRunDto>> updateOverheads(
            @PathVariable Long id,
            @RequestBody OverheadsUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Overheads updated successfully",
                productionService.updateOverheads(id, req.getLabourCost(), req.getGasPowerCost(), req.getOtherOverheadCost())));
    }

    @Data
    public static class OverheadsUpdateRequest {
        private BigDecimal labourCost;
        private BigDecimal gasPowerCost;
        private BigDecimal otherOverheadCost;
    }
}

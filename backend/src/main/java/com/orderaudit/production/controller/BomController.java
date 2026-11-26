package com.orderaudit.production.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.production.dto.BomDto;
import com.orderaudit.production.dto.CreateBomRequest;
import com.orderaudit.production.service.BomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/boms", "/api/production/boms"})
@RequiredArgsConstructor
public class BomController {
    private final BomService bomService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR')")
    public ResponseEntity<ApiResponse<BomDto>> createBom(
            @Valid @RequestBody CreateBomRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("BOM created successfully", bomService.createBom(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BomDto>>> getAllActiveBoms() {
        return ResponseEntity.ok(ApiResponse.ok(bomService.getAllActiveBoms()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BomDto>> getBomById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bomService.getBomById(id)));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<BomDto>> getActiveBomForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(bomService.getActiveBomForProduct(productId)));
    }
}

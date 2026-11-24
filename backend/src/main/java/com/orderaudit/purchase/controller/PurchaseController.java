package com.orderaudit.purchase.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.purchase.dto.CreatePurchaseRequest;
import com.orderaudit.purchase.dto.PurchaseDto;
import com.orderaudit.purchase.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {
    private final PurchaseService purchaseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PRODUCTION_SUPERVISOR')")
    public ResponseEntity<ApiResponse<PurchaseDto>> createPurchase(
            @Valid @RequestBody CreatePurchaseRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Purchase recorded successfully", purchaseService.createPurchase(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseDto>>> getAllPurchases() {
        return ResponseEntity.ok(ApiResponse.ok(purchaseService.getAllPurchases()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseDto>> getPurchaseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(purchaseService.getPurchaseById(id)));
    }
}

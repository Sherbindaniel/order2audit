package com.orderaudit.supplier.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.supplier.dto.CreateSupplierRequest;
import com.orderaudit.supplier.dto.SupplierDto;
import com.orderaudit.supplier.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupplierDto>>> getAllSuppliers() {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getAllSuppliers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierDto>> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getSupplierById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<SupplierDto>> createSupplier(@Valid @RequestBody CreateSupplierRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Supplier created successfully", supplierService.createSupplier(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<SupplierDto>> updateSupplier(@PathVariable Long id, @Valid @RequestBody CreateSupplierRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Supplier updated successfully", supplierService.updateSupplier(id, req)));
    }
}

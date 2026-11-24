package com.orderaudit.sales.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.sales.dto.CreateOrderRequest;
import com.orderaudit.sales.dto.OrderApprovalRequest;
import com.orderaudit.sales.dto.SalesOrderDto;
import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.service.SalesOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class SalesOrderController {
    private final SalesOrderService salesOrderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SALESMAN', 'ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<SalesOrderDto>> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long salesmanId = userPrincipal != null ? userPrincipal.getId() : 1L;
        return ResponseEntity.ok(ApiResponse.ok("Order placed successfully", salesOrderService.createOrder(req, salesmanId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SalesOrderDto>>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null && userPrincipal.getRole().name().equals("SALESMAN")) {
            return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getOrdersBySalesman(userPrincipal.getId())));
        }
        if (status != null) {
            return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getOrdersByStatus(status)));
        }
        return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getAllOrders()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SalesOrderDto>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getOrderById(id)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<SalesOrderDto>> approveOrder(
            @PathVariable Long id,
            @RequestBody OrderApprovalRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long adminId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Order status updated", salesOrderService.approveOrder(id, req, adminId)));
    }
}

package com.orderaudit.reporting.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.reporting.dto.*;
import com.orderaudit.reporting.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/owner")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<OwnerDashboardDto>> getOwnerDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getOwnerDashboard()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAdminDashboard()));
    }

    @GetMapping("/salesman")
    @PreAuthorize("hasAnyRole('SALESMAN', 'OWNER')")
    public ResponseEntity<ApiResponse<SalesmanDashboardDto>> getSalesmanDashboard(@AuthenticationPrincipal UserPrincipal user) {
        Long salesmanId = user != null ? user.getId() : 1L;
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getSalesmanDashboard(salesmanId)));
    }

    @GetMapping("/production")
    @PreAuthorize("hasAnyRole('PRODUCTION_SUPERVISOR', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductionDashboardDto>> getProductionDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getProductionDashboard()));
    }

    @GetMapping("/accountant")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'OWNER')")
    public ResponseEntity<ApiResponse<AccountantDashboardDto>> getAccountantDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAccountantDashboard()));
    }
}

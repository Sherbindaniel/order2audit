package com.orderaudit.costing.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.costing.dto.CostingDto;
import com.orderaudit.costing.dto.MarginReportDto;
import com.orderaudit.costing.service.CostingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/costing")
@RequiredArgsConstructor
public class CostingController {
    private final CostingService costingService;

    @GetMapping("/production/{runId}")
    public ResponseEntity<ApiResponse<CostingDto>> getCostingForRun(@PathVariable Long runId) {
        return ResponseEntity.ok(ApiResponse.ok(costingService.getCostingForRun(runId)));
    }

    @GetMapping("/margins")
    public ResponseEntity<ApiResponse<List<MarginReportDto>>> getMarginReport() {
        return ResponseEntity.ok(ApiResponse.ok(costingService.getMarginReport()));
    }
}

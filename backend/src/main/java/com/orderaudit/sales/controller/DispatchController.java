package com.orderaudit.sales.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.sales.dto.CreateDispatchRequest;
import com.orderaudit.sales.dto.DispatchDto;
import com.orderaudit.sales.service.DispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatches")
@RequiredArgsConstructor
public class DispatchController {
    private final DispatchService dispatchService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<DispatchDto>> createDispatch(
            @Valid @RequestBody CreateDispatchRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Dispatch completed successfully", dispatchService.createDispatch(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DispatchDto>>> getAllDispatches() {
        return ResponseEntity.ok(ApiResponse.ok(dispatchService.getAllDispatches()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DispatchDto>> getDispatchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(dispatchService.getDispatchById(id)));
    }
}

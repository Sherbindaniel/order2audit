package com.orderaudit.customer.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.customer.dto.CreateCustomerRequest;
import com.orderaudit.customer.dto.CustomerDto;
import com.orderaudit.customer.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerDto>>> getAllCustomers(@RequestParam(required = false) Long salesmanId) {
        List<CustomerDto> list = salesmanId != null ?
                customerService.getCustomersBySalesman(salesmanId) :
                customerService.getAllCustomers();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.getCustomerById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALESMAN')")
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(@Valid @RequestBody CreateCustomerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Customer created successfully", customerService.createCustomer(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<CustomerDto>> updateCustomer(@PathVariable Long id, @Valid @RequestBody CreateCustomerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Customer updated successfully", customerService.updateCustomer(id, req)));
    }
}

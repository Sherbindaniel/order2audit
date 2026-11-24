package com.orderaudit.payment.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.payment.dto.CreatePaymentRequest;
import com.orderaudit.payment.dto.OutstandingDto;
import com.orderaudit.payment.dto.PaymentDto;
import com.orderaudit.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PaymentDto>> recordPayment(
            @Valid @RequestBody CreatePaymentRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Payment recorded successfully", paymentService.recordPayment(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentDto>>> getAllPayments(@RequestParam(required = false) Long customerId) {
        List<PaymentDto> list = customerId != null ?
                paymentService.getPaymentsByCustomer(customerId) :
                paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentById(id)));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<List<OutstandingDto>>> getAllOutstandings() {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getAllOutstandings()));
    }

    @GetMapping("/outstanding/{customerId}")
    public ResponseEntity<ApiResponse<OutstandingDto>> getCustomerOutstanding(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getCustomerOutstanding(customerId)));
    }
}

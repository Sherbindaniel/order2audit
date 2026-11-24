package com.orderaudit.payment.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.customer.entity.Customer;
import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.invoice.entity.Invoice;
import com.orderaudit.invoice.repository.InvoiceRepository;
import com.orderaudit.payment.dto.*;
import com.orderaudit.payment.entity.Payment;
import com.orderaudit.payment.entity.PaymentAllocation;
import com.orderaudit.payment.entity.PaymentMethod;
import com.orderaudit.payment.repository.PaymentRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @Transactional
    public PaymentDto recordPayment(CreatePaymentRequest req, Long userId) {
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", req.getCustomerId()));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        LocalDate date = req.getPaymentDate() != null ? req.getPaymentDate() : LocalDate.now();

        String paymentNumber = generatePaymentNumber(date);

        Payment payment = Payment.builder()
                .paymentNumber(paymentNumber)
                .customer(customer)
                .amount(req.getAmount())
                .paymentDate(date)
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : PaymentMethod.CASH)
                .referenceNumber(req.getReferenceNumber())
                .notes(req.getNotes())
                .receivedBy(user)
                .build();

        Payment saved = paymentRepository.save(payment);

        List<PaymentAllocation> allocationList = new ArrayList<>();
        BigDecimal remainingToAllocate = req.getAmount();

        if (req.getAllocations() != null && !req.getAllocations().isEmpty()) {
            for (PaymentAllocationRequest allocReq : req.getAllocations()) {
                Invoice inv = invoiceRepository.findById(allocReq.getInvoiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", allocReq.getInvoiceId()));

                if (!inv.getCustomer().getId().equals(customer.getId())) {
                    throw new BusinessException("Invoice " + inv.getInvoiceNumber() + " does not belong to customer " + customer.getName());
                }

                BigDecimal allocAmount = allocReq.getAmount();
                if (allocAmount.compareTo(inv.getAmountDue()) > 0) {
                    throw new BusinessException("Allocated amount cannot exceed invoice amount due of ₹" + inv.getAmountDue());
                }

                inv.setAmountPaid(inv.getAmountPaid().add(allocAmount));
                inv.setAmountDue(inv.getAmountDue().subtract(allocAmount));
                invoiceRepository.save(inv);

                allocationList.add(PaymentAllocation.builder()
                        .payment(saved)
                        .invoice(inv)
                        .allocatedAmount(allocAmount)
                        .build());
            }
        } else {
            // Auto-allocate to oldest unpaid invoices
            List<Invoice> unpaidInvoices = invoiceRepository.findByCustomerIdOrderByInvoiceDateDesc(customer.getId()).stream()
                    .filter(i -> i.getAmountDue().compareTo(BigDecimal.ZERO) > 0)
                    .sorted((a, b) -> a.getInvoiceDate().compareTo(b.getInvoiceDate()))
                    .collect(Collectors.toList());

            for (Invoice inv : unpaidInvoices) {
                if (remainingToAllocate.compareTo(BigDecimal.ZERO) <= 0) break;

                BigDecimal allocate = remainingToAllocate.min(inv.getAmountDue());
                inv.setAmountPaid(inv.getAmountPaid().add(allocate));
                inv.setAmountDue(inv.getAmountDue().subtract(allocate));
                invoiceRepository.save(inv);

                allocationList.add(PaymentAllocation.builder()
                        .payment(saved)
                        .invoice(inv)
                        .allocatedAmount(allocate)
                        .build());

                remainingToAllocate = remainingToAllocate.subtract(allocate);
            }
        }

        saved.setAllocations(allocationList);
        return toDto(paymentRepository.save(saved));
    }

    public PaymentDto getPaymentById(Long id) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        return toDto(p);
    }

    public List<PaymentDto> getAllPayments() {
        return paymentRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<PaymentDto> getPaymentsByCustomer(Long customerId) {
        return paymentRepository.findByCustomerIdOrderByPaymentDateDesc(customerId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public OutstandingDto getCustomerOutstanding(Long customerId) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        List<Invoice> invoices = invoiceRepository.findByCustomerIdOrderByInvoiceDateDesc(customerId);

        BigDecimal totalInvoiced = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalDue = BigDecimal.ZERO;

        BigDecimal b0_30 = BigDecimal.ZERO;
        BigDecimal b31_60 = BigDecimal.ZERO;
        BigDecimal b61_90 = BigDecimal.ZERO;
        BigDecimal bOver90 = BigDecimal.ZERO;

        LocalDate today = LocalDate.now();

        for (Invoice inv : invoices) {
            totalInvoiced = totalInvoiced.add(inv.getTotalAmount());
            totalPaid = totalPaid.add(inv.getAmountPaid());
            totalDue = totalDue.add(inv.getAmountDue());

            if (inv.getAmountDue().compareTo(BigDecimal.ZERO) > 0) {
                long days = ChronoUnit.DAYS.between(inv.getInvoiceDate(), today);
                if (days <= 30) {
                    b0_30 = b0_30.add(inv.getAmountDue());
                } else if (days <= 60) {
                    b31_60 = b31_60.add(inv.getAmountDue());
                } else if (days <= 90) {
                    b61_90 = b61_90.add(inv.getAmountDue());
                } else {
                    bOver90 = bOver90.add(inv.getAmountDue());
                }
            }
        }

        return OutstandingDto.builder()
                .customerId(c.getId())
                .customerName(c.getName())
                .totalInvoiced(totalInvoiced)
                .totalPaid(totalPaid)
                .totalOutstanding(totalDue)
                .bucket0_30(b0_30)
                .bucket31_60(b31_60)
                .bucket61_90(b61_90)
                .bucketOver90(bOver90)
                .build();
    }

    public List<OutstandingDto> getAllOutstandings() {
        return customerRepository.findByActiveTrue().stream()
                .map(c -> getCustomerOutstanding(c.getId()))
                .collect(Collectors.toList());
    }

    private String generatePaymentNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = paymentRepository.countByPaymentDate(date) + 1;
        return String.format("PAY-%s-%03d", dateStr, count);
    }

    private PaymentDto toDto(Payment p) {
        List<PaymentAllocationDto> allocs = p.getAllocations() != null ? p.getAllocations().stream().map(a ->
                PaymentAllocationDto.builder()
                        .id(a.getId())
                        .invoiceId(a.getInvoice().getId())
                        .invoiceNumber(a.getInvoice().getInvoiceNumber())
                        .allocatedAmount(a.getAllocatedAmount())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return PaymentDto.builder()
                .id(p.getId())
                .paymentNumber(p.getPaymentNumber())
                .customerId(p.getCustomer().getId())
                .customerName(p.getCustomer().getName())
                .amount(p.getAmount())
                .paymentDate(p.getPaymentDate())
                .paymentMethod(p.getPaymentMethod())
                .referenceNumber(p.getReferenceNumber())
                .notes(p.getNotes())
                .allocations(allocs)
                .build();
    }
}

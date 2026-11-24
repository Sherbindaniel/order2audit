package com.orderaudit.invoice.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.config.AppProperties;
import com.orderaudit.customer.entity.Customer;
import com.orderaudit.invoice.dto.CreateInvoiceRequest;
import com.orderaudit.invoice.dto.InvoiceDto;
import com.orderaudit.invoice.dto.InvoiceItemDto;
import com.orderaudit.invoice.entity.*;
import com.orderaudit.invoice.repository.InvoiceRepository;
import com.orderaudit.invoice.repository.InvoiceSequenceRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.entity.SalesOrder;
import com.orderaudit.sales.entity.SalesOrderItem;
import com.orderaudit.sales.repository.SalesOrderRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final InvoiceSequenceRepository sequenceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional
    public InvoiceDto generateInvoice(CreateInvoiceRequest req, Long userId) {
        SalesOrder order = salesOrderRepository.findById(req.getSalesOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", req.getSalesOrderId()));

        if (order.getStatus() != OrderStatus.APPROVED) {
            throw new BusinessException("Cannot generate invoice for order in status: " + order.getStatus() + ". Order must be APPROVED.");
        }

        // Check if invoice already exists
        if (invoiceRepository.findBySalesOrderId(order.getId()).isPresent()) {
            throw new BusinessException("Invoice already exists for order " + order.getOrderNumber());
        }

        Customer customer = order.getCustomer();
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        LocalDate today = LocalDate.now();

        // Financial year calculation: e.g. 2024-25
        String fy = getFinancialYear(today);

        // Sequence numbering
        InvoiceSequence seq = sequenceRepository.findByFinancialYear(fy)
                .orElseGet(() -> InvoiceSequence.builder().financialYear(fy).lastNumber(0).prefix("INV").build());
        seq.setLastNumber(seq.getLastNumber() + 1);
        sequenceRepository.save(seq);

        String invoiceNumber = String.format("%s/%s/%03d", seq.getPrefix(), fy, seq.getLastNumber());

        // Determine GST type based on place of supply:
        // Intra-state if customer state code matches company state code (Tamil Nadu 33)
        // Inter-state if different (e.g. Karnataka 29)
        boolean isIntraState = appProperties.getCompany().getStateCode().equalsIgnoreCase(customer.getStateCode());
        GstType gstType = isIntraState ? GstType.INTRA_STATE : GstType.INTER_STATE;

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalCgst = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;
        BigDecimal totalIgst = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();

        for (SalesOrderItem orderItem : order.getItems()) {
            Product prod = orderItem.getProduct();
            BigDecimal taxable = orderItem.getQuantity().multiply(orderItem.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(taxable);

            BigDecimal rate = prod.getGstRate() != null ? prod.getGstRate() : new BigDecimal("5.00");
            BigDecimal cgst = BigDecimal.ZERO;
            BigDecimal sgst = BigDecimal.ZERO;
            BigDecimal igst = BigDecimal.ZERO;

            if (isIntraState) {
                // Intra-state: CGST = rate/2, SGST = rate/2
                BigDecimal halfRate = rate.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP);
                cgst = taxable.multiply(halfRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                sgst = taxable.multiply(halfRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                totalCgst = totalCgst.add(cgst);
                totalSgst = totalSgst.add(sgst);
            } else {
                // Inter-state: IGST = full rate
                igst = taxable.multiply(rate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                totalIgst = totalIgst.add(igst);
            }

            BigDecimal itemTotal = taxable.add(cgst).add(sgst).add(igst);

            InvoiceItem invItem = InvoiceItem.builder()
                    .product(prod)
                    .hsnCode(prod.getHsnCode() != null ? prod.getHsnCode() : "2106")
                    .quantity(orderItem.getQuantity())
                    .unitPrice(orderItem.getUnitPrice())
                    .taxableValue(taxable)
                    .gstRate(rate)
                    .cgstAmount(cgst)
                    .sgstAmount(sgst)
                    .igstAmount(igst)
                    .totalAmount(itemTotal)
                    .build();

            items.add(invItem);
        }

        BigDecimal totalTax = totalCgst.add(totalSgst).add(totalIgst);
        BigDecimal grandTotal = subtotal.add(totalTax);

        BigDecimal cgstRate = isIntraState ? appProperties.getGst().getDefaultRate().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal sgstRate = isIntraState ? appProperties.getGst().getDefaultRate().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal igstRate = !isIntraState ? appProperties.getGst().getDefaultRate() : BigDecimal.ZERO;

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .salesOrder(order)
                .customer(customer)
                .invoiceDate(today)
                .financialYear(fy)
                .gstType(gstType)
                .subtotal(subtotal)
                .cgstRate(cgstRate)
                .cgstAmount(totalCgst)
                .sgstRate(sgstRate)
                .sgstAmount(totalSgst)
                .igstRate(igstRate)
                .igstAmount(totalIgst)
                .totalTax(totalTax)
                .totalAmount(grandTotal)
                .amountPaid(BigDecimal.ZERO)
                .amountDue(grandTotal)
                .status(InvoiceStatus.POSTED)
                .companyName(appProperties.getCompany().getName())
                .companyGstin(appProperties.getCompany().getGstin())
                .companyAddress(appProperties.getCompany().getAddress())
                .companyState(appProperties.getCompany().getState())
                .companyStateCode(appProperties.getCompany().getStateCode())
                .customerName(customer.getName())
                .customerGstin(customer.getGstin())
                .customerAddress(customer.getAddress())
                .customerState(customer.getState())
                .customerStateCode(customer.getStateCode())
                .createdBy(user)
                .build();

        for (InvoiceItem item : items) {
            item.setInvoice(invoice);
        }
        invoice.setItems(items);

        Invoice saved = invoiceRepository.save(invoice);

        // Update sales order status to INVOICED
        order.setStatus(OrderStatus.INVOICED);
        salesOrderRepository.save(order);

        return toDto(saved);
    }

    public InvoiceDto getInvoiceById(Long id) {
        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return toDto(inv);
    }

    public List<InvoiceDto> getAllInvoices() {
        return invoiceRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<InvoiceDto> getInvoicesByCustomer(Long customerId) {
        return invoiceRepository.findByCustomerIdOrderByInvoiceDateDesc(customerId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private String getFinancialYear(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();
        if (month >= 4) {
            return String.format("%d-%02d", year, (year + 1) % 100);
        } else {
            return String.format("%d-%02d", year - 1, year % 100);
        }
    }

    public InvoiceDto toDto(Invoice inv) {
        List<InvoiceItemDto> items = inv.getItems() != null ? inv.getItems().stream().map(i ->
                InvoiceItemDto.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productName(i.getProduct().getName())
                        .hsnCode(i.getHsnCode())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .taxableValue(i.getTaxableValue())
                        .gstRate(i.getGstRate())
                        .cgstAmount(i.getCgstAmount())
                        .sgstAmount(i.getSgstAmount())
                        .igstAmount(i.getIgstAmount())
                        .totalAmount(i.getTotalAmount())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return InvoiceDto.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .salesOrderId(inv.getSalesOrder().getId())
                .orderNumber(inv.getSalesOrder().getOrderNumber())
                .customerId(inv.getCustomer().getId())
                .customerName(inv.getCustomerName())
                .customerGstin(inv.getCustomerGstin())
                .invoiceDate(inv.getInvoiceDate())
                .financialYear(inv.getFinancialYear())
                .gstType(inv.getGstType())
                .subtotal(inv.getSubtotal())
                .cgstRate(inv.getCgstRate())
                .cgstAmount(inv.getCgstAmount())
                .sgstRate(inv.getSgstRate())
                .sgstAmount(inv.getSgstAmount())
                .igstRate(inv.getIgstRate())
                .igstAmount(inv.getIgstAmount())
                .totalTax(inv.getTotalTax())
                .totalAmount(inv.getTotalAmount())
                .amountPaid(inv.getAmountPaid())
                .amountDue(inv.getAmountDue())
                .status(inv.getStatus())
                .companyName(inv.getCompanyName())
                .companyGstin(inv.getCompanyGstin())
                .companyAddress(inv.getCompanyAddress())
                .items(items)
                .build();
    }
}

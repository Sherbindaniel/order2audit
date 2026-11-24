package com.orderaudit.invoice.dto;

import com.orderaudit.invoice.entity.GstType;
import com.orderaudit.invoice.entity.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDto {
    private Long id;
    private String invoiceNumber;
    private Long salesOrderId;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerGstin;
    private LocalDate invoiceDate;
    private String financialYear;
    private GstType gstType;
    private BigDecimal subtotal;
    private BigDecimal cgstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstRate;
    private BigDecimal sgstAmount;
    private BigDecimal igstRate;
    private BigDecimal igstAmount;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal amountDue;
    private InvoiceStatus status;
    private String companyName;
    private String companyGstin;
    private String companyAddress;
    private List<InvoiceItemDto> items;
}

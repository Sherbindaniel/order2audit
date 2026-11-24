package com.orderaudit.reporting.dto;

import com.orderaudit.invoice.entity.GstType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstEntryDto {
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String customerName;
    private String customerGstin;
    private GstType gstType;
    private BigDecimal taxableValue;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
}

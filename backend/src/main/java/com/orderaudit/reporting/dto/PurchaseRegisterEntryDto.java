package com.orderaudit.reporting.dto;

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
public class PurchaseRegisterEntryDto {
    private String purchaseNumber;
    private LocalDate purchaseDate;
    private String supplierName;
    private BigDecimal totalAmount;
    private String itemsDescription;
}

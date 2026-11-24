package com.orderaudit.purchase.dto;

import com.orderaudit.purchase.entity.PurchaseStatus;
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
public class PurchaseDto {
    private Long id;
    private String purchaseNumber;
    private Long supplierId;
    private String supplierName;
    private LocalDate purchaseDate;
    private BigDecimal totalAmount;
    private PurchaseStatus status;
    private String notes;
    private List<PurchaseItemDto> items;
}

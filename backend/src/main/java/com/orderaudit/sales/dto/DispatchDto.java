package com.orderaudit.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchDto {
    private Long id;
    private String dispatchNumber;
    private Long invoiceId;
    private String invoiceNumber;
    private Long salesOrderId;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private LocalDate dispatchDate;
    private String notes;
    private List<DispatchItemDto> items;
}

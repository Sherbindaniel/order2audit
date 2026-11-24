package com.orderaudit.sales.dto;

import com.orderaudit.sales.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderDto {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerState;
    private String customerStateCode;
    private Long salesmanId;
    private String salesmanName;
    private LocalDate orderDate;
    private OrderStatus status;
    private String rejectionReason;
    private BigDecimal totalAmount;
    private String notes;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private List<SalesOrderItemDto> items;
}

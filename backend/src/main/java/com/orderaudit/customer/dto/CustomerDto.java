package com.orderaudit.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDto {
    private Long id;
    private String name;
    private String customerType;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String city;
    private String state;
    private String stateCode;
    private String pincode;
    private String gstin;
    private BigDecimal creditLimit;
    private Long assignedSalesmanId;
    private String assignedSalesmanName;
    private boolean active;
}

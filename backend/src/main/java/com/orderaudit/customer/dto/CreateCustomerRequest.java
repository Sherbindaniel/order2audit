package com.orderaudit.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCustomerRequest {
    @NotBlank(message = "Customer name is required")
    private String name;

    private String customerType;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "State code is required")
    private String stateCode;

    private String pincode;
    private String gstin;
    private BigDecimal creditLimit;
    private Long assignedSalesmanId;
}

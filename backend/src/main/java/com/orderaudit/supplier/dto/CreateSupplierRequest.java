package com.orderaudit.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupplierRequest {
    @NotBlank(message = "Supplier name is required")
    private String name;

    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String gstin;
    private String state;
    private String stateCode;
}

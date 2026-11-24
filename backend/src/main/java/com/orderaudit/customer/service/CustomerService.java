package com.orderaudit.customer.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.customer.dto.CreateCustomerRequest;
import com.orderaudit.customer.dto.CustomerDto;
import com.orderaudit.customer.entity.Customer;
import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<CustomerDto> getCustomersBySalesman(Long salesmanId) {
        return customerRepository.findByAssignedSalesmanId(salesmanId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public CustomerDto getCustomerById(Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return toDto(c);
    }

    @Transactional
    public CustomerDto createCustomer(CreateCustomerRequest req) {
        User salesman = null;
        if (req.getAssignedSalesmanId() != null) {
            salesman = userRepository.findById(req.getAssignedSalesmanId()).orElse(null);
        }

        Customer c = Customer.builder()
                .name(req.getName())
                .customerType(req.getCustomerType() != null ? req.getCustomerType() : "RETAILER")
                .contactPerson(req.getContactPerson())
                .phone(req.getPhone())
                .email(req.getEmail())
                .address(req.getAddress())
                .city(req.getCity())
                .state(req.getState())
                .stateCode(req.getStateCode())
                .pincode(req.getPincode())
                .gstin(req.getGstin())
                .creditLimit(req.getCreditLimit() != null ? req.getCreditLimit() : BigDecimal.ZERO)
                .assignedSalesman(salesman)
                .active(true)
                .build();

        return toDto(customerRepository.save(c));
    }

    @Transactional
    public CustomerDto updateCustomer(Long id, CreateCustomerRequest req) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        c.setName(req.getName());
        if (req.getCustomerType() != null) c.setCustomerType(req.getCustomerType());
        c.setContactPerson(req.getContactPerson());
        c.setPhone(req.getPhone());
        c.setEmail(req.getEmail());
        c.setAddress(req.getAddress());
        c.setCity(req.getCity());
        c.setState(req.getState());
        c.setStateCode(req.getStateCode());
        c.setPincode(req.getPincode());
        c.setGstin(req.getGstin());
        if (req.getCreditLimit() != null) c.setCreditLimit(req.getCreditLimit());
        if (req.getAssignedSalesmanId() != null) {
            c.setAssignedSalesman(userRepository.findById(req.getAssignedSalesmanId()).orElse(null));
        }

        return toDto(customerRepository.save(c));
    }

    public CustomerDto toDto(Customer c) {
        return CustomerDto.builder()
                .id(c.getId())
                .name(c.getName())
                .customerType(c.getCustomerType())
                .contactPerson(c.getContactPerson())
                .phone(c.getPhone())
                .email(c.getEmail())
                .address(c.getAddress())
                .city(c.getCity())
                .state(c.getState())
                .stateCode(c.getStateCode())
                .pincode(c.getPincode())
                .gstin(c.getGstin())
                .creditLimit(c.getCreditLimit())
                .assignedSalesmanId(c.getAssignedSalesman() != null ? c.getAssignedSalesman().getId() : null)
                .assignedSalesmanName(c.getAssignedSalesman() != null ? c.getAssignedSalesman().getFullName() : null)
                .active(c.isActive())
                .build();
    }
}

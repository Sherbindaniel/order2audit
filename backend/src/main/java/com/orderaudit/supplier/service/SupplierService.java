package com.orderaudit.supplier.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.supplier.dto.CreateSupplierRequest;
import com.orderaudit.supplier.dto.SupplierDto;
import com.orderaudit.supplier.entity.Supplier;
import com.orderaudit.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public SupplierDto getSupplierById(Long id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return toDto(s);
    }

    @Transactional
    public SupplierDto createSupplier(CreateSupplierRequest req) {
        Supplier s = Supplier.builder()
                .name(req.getName())
                .contactPerson(req.getContactPerson())
                .phone(req.getPhone())
                .email(req.getEmail())
                .address(req.getAddress())
                .gstin(req.getGstin())
                .state(req.getState())
                .stateCode(req.getStateCode())
                .active(true)
                .build();
        return toDto(supplierRepository.save(s));
    }

    @Transactional
    public SupplierDto updateSupplier(Long id, CreateSupplierRequest req) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        s.setName(req.getName());
        s.setContactPerson(req.getContactPerson());
        s.setPhone(req.getPhone());
        s.setEmail(req.getEmail());
        s.setAddress(req.getAddress());
        s.setGstin(req.getGstin());
        s.setState(req.getState());
        s.setStateCode(req.getStateCode());
        return toDto(supplierRepository.save(s));
    }

    public SupplierDto toDto(Supplier s) {
        return SupplierDto.builder()
                .id(s.getId())
                .name(s.getName())
                .contactPerson(s.getContactPerson())
                .phone(s.getPhone())
                .email(s.getEmail())
                .address(s.getAddress())
                .gstin(s.getGstin())
                .state(s.getState())
                .stateCode(s.getStateCode())
                .active(s.isActive())
                .build();
    }
}

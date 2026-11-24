const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../backend/src/main/java/com/orderaudit');

function writeFile(relPath, content) {
    const fullPath = path.join(BASE, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created:', relPath);
}

// 1. Customer Module
writeFile('customer/entity/Customer.java', `
package com.orderaudit.customer.entity;

import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "customer_type", length = 30)
    @Builder.Default
    private String customerType = "RETAILER";

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 50)
    private String city;

    @Column(nullable = false, length = 50)
    private String state;

    @Column(name = "state_code", nullable = false, length = 2)
    private String stateCode;

    @Column(length = 10)
    private String pincode;

    @Column(length = 15)
    private String gstin;

    @Column(name = "credit_limit", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal creditLimit = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_salesman_id")
    private User assignedSalesman;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
`);

writeFile('customer/repository/CustomerRepository.java', `
package com.orderaudit.customer.repository;

import com.orderaudit.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByActiveTrue();
    List<Customer> findByAssignedSalesmanId(Long salesmanId);
    Optional<Customer> findByName(String name);
}
`);

writeFile('customer/dto/CustomerDto.java', `
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
`);

writeFile('customer/dto/CreateCustomerRequest.java', `
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
`);

writeFile('customer/service/CustomerService.java', `
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
`);

writeFile('customer/controller/CustomerController.java', `
package com.orderaudit.customer.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.customer.dto.CreateCustomerRequest;
import com.orderaudit.customer.dto.CustomerDto;
import com.orderaudit.customer.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerDto>>> getAllCustomers(@RequestParam(required = false) Long salesmanId) {
        List<CustomerDto> list = salesmanId != null ?
                customerService.getCustomersBySalesman(salesmanId) :
                customerService.getAllCustomers();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.getCustomerById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALESMAN')")
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(@Valid @RequestBody CreateCustomerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Customer created successfully", customerService.createCustomer(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<CustomerDto>> updateCustomer(@PathVariable Long id, @Valid @RequestBody CreateCustomerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Customer updated successfully", customerService.updateCustomer(id, req)));
    }
}
`);

// 2. Sales Orders Module
writeFile('sales/entity/OrderStatus.java', `
package com.orderaudit.sales.entity;

public enum OrderStatus {
    DRAFT,
    SUBMITTED,
    APPROVED,
    REJECTED,
    INVOICED,
    PARTIALLY_DISPATCHED,
    DISPATCHED,
    CANCELLED;

    public static boolean isValidTransition(OrderStatus from, OrderStatus to) {
        if (from == to) return true;
        if (to == CANCELLED) return from != DISPATCHED;

        return switch (from) {
            case DRAFT -> to == SUBMITTED;
            case SUBMITTED -> to == APPROVED || to == REJECTED;
            case APPROVED -> to == INVOICED || to == REJECTED;
            case REJECTED -> to == DRAFT;
            case INVOICED -> to == DISPATCHED || to == PARTIALLY_DISPATCHED;
            case PARTIALLY_DISPATCHED -> to == DISPATCHED;
            case DISPATCHED, CANCELLED -> false;
        };
    }
}
`);

writeFile('sales/entity/SalesOrder.java', `
package com.orderaudit.sales.entity;

import com.orderaudit.customer.entity.Customer;
import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales_orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 30)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salesman_id", nullable = false)
    private User salesman;

    @Column(name = "order_date", nullable = false)
    @Builder.Default
    private LocalDate orderDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.DRAFT;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SalesOrderItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
`);

writeFile('sales/entity/SalesOrderItem.java', `
package com.orderaudit.sales.entity;

import com.orderaudit.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "available_stock", precision = 10, scale = 2)
    private BigDecimal availableStock;

    @Column(name = "shortage_quantity", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shortageQuantity = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

// 3. Sales Order Repositories
writeFile('sales/repository/SalesOrderRepository.java', `
package com.orderaudit.sales.repository;

import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findByOrderNumber(String orderNumber);
    List<SalesOrder> findBySalesmanIdOrderByOrderDateDesc(Long salesmanId);
    List<SalesOrder> findByCustomerIdOrderByOrderDateDesc(Long customerId);
    List<SalesOrder> findByStatusOrderByOrderDateDesc(OrderStatus status);
    List<SalesOrder> findByOrderDateBetweenOrderByOrderDateDesc(LocalDate from, LocalDate to);
    long countByOrderDate(LocalDate date);
    long countByStatus(OrderStatus status);
}
`);

writeFile('sales/repository/SalesOrderItemRepository.java', `
package com.orderaudit.sales.repository;

import com.orderaudit.sales.entity.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long> {
    List<SalesOrderItem> findBySalesOrderId(Long orderId);
}
`);

// 4. Sales Order DTOs
writeFile('sales/dto/SalesOrderItemDto.java', `
package com.orderaudit.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private BigDecimal availableStock;
    private BigDecimal shortageQuantity;
}
`);

writeFile('sales/dto/SalesOrderDto.java', `
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
`);

writeFile('sales/dto/OrderItemRequest.java', `
package com.orderaudit.sales.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;
}
`);

writeFile('sales/dto/CreateOrderRequest.java', `
package com.orderaudit.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private String notes;

    @NotEmpty(message = "Order must have at least one item")
    @Valid
    private List<OrderItemRequest> items;
}
`);

writeFile('sales/dto/OrderApprovalRequest.java', `
package com.orderaudit.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderApprovalRequest {
    private boolean approved;
    private String rejectionReason;
}
`);

// 5. Sales Order Service and Controller
writeFile('sales/service/SalesOrderService.java', `
package com.orderaudit.sales.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.customer.entity.Customer;
import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.sales.dto.*;
import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.entity.SalesOrder;
import com.orderaudit.sales.entity.SalesOrderItem;
import com.orderaudit.sales.repository.SalesOrderRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesOrderService {
    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    @Transactional
    public SalesOrderDto createOrder(CreateOrderRequest req, Long salesmanId) {
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", req.getCustomerId()));

        User salesman = userRepository.findById(salesmanId)
                .orElseThrow(() -> new ResourceNotFoundException("Salesman", "id", salesmanId));

        String orderNumber = generateOrderNumber(LocalDate.now());

        SalesOrder order = SalesOrder.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .salesman(salesman)
                .orderDate(LocalDate.now())
                .status(OrderStatus.SUBMITTED) // Fast flow: Salesman submit
                .notes(req.getNotes())
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<SalesOrderItem> itemList = new ArrayList<>();

        for (OrderItemRequest itemReq : req.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            BigDecimal total = itemReq.getQuantity().multiply(product.getSellingPrice());
            grandTotal = grandTotal.add(total);

            // Check current stock
            BigDecimal currentStock = inventoryService.getCurrentProductStock(product.getId());
            BigDecimal shortage = BigDecimal.ZERO;
            if (currentStock.compareTo(itemReq.getQuantity()) < 0) {
                shortage = itemReq.getQuantity().subtract(currentStock);
            }

            SalesOrderItem item = SalesOrderItem.builder()
                    .salesOrder(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(product.getSellingPrice())
                    .totalPrice(total)
                    .availableStock(currentStock)
                    .shortageQuantity(shortage)
                    .build();

            itemList.add(item);
        }

        order.setTotalAmount(grandTotal);
        order.setItems(itemList);

        return toDto(salesOrderRepository.save(order));
    }

    @Transactional
    public SalesOrderDto approveOrder(Long orderId, OrderApprovalRequest req, Long adminId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", orderId));

        if (order.getStatus() != OrderStatus.SUBMITTED && order.getStatus() != OrderStatus.APPROVED) {
            throw new BusinessException("Cannot approve order in status: " + order.getStatus());
        }

        User admin = userRepository.findById(adminId).orElse(null);

        if (!req.isApproved()) {
            order.setStatus(OrderStatus.REJECTED);
            order.setRejectionReason(req.getRejectionReason());
            return toDto(salesOrderRepository.save(order));
        }

        // Verify stock for each item upon approval
        for (SalesOrderItem item : order.getItems()) {
            BigDecimal currentStock = inventoryService.getCurrentProductStock(item.getProduct().getId());
            item.setAvailableStock(currentStock);
            if (currentStock.compareTo(item.getQuantity()) < 0) {
                item.setShortageQuantity(item.getQuantity().subtract(currentStock));
            } else {
                item.setShortageQuantity(BigDecimal.ZERO);
            }
        }

        order.setStatus(OrderStatus.APPROVED);
        order.setApprovedBy(admin);
        order.setApprovedAt(LocalDateTime.now());

        return toDto(salesOrderRepository.save(order));
    }

    public SalesOrderDto getOrderById(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", id));
        return toDto(order);
    }

    public List<SalesOrderDto> getAllOrders() {
        return salesOrderRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<SalesOrderDto> getOrdersBySalesman(Long salesmanId) {
        return salesOrderRepository.findBySalesmanIdOrderByOrderDateDesc(salesmanId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<SalesOrderDto> getOrdersByStatus(OrderStatus status) {
        return salesOrderRepository.findByStatusOrderByOrderDateDesc(status)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private String generateOrderNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = salesOrderRepository.countByOrderDate(date) + 1;
        return String.format("SO-%s-%03d", dateStr, count);
    }

    public SalesOrderDto toDto(SalesOrder o) {
        List<SalesOrderItemDto> items = o.getItems() != null ? o.getItems().stream().map(i ->
                SalesOrderItemDto.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productName(i.getProduct().getName())
                        .sku(i.getProduct().getSku())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .totalPrice(i.getTotalPrice())
                        .availableStock(i.getAvailableStock())
                        .shortageQuantity(i.getShortageQuantity())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return SalesOrderDto.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .customerId(o.getCustomer().getId())
                .customerName(o.getCustomer().getName())
                .customerState(o.getCustomer().getState())
                .customerStateCode(o.getCustomer().getStateCode())
                .salesmanId(o.getSalesman().getId())
                .salesmanName(o.getSalesman().getFullName())
                .orderDate(o.getOrderDate())
                .status(o.getStatus())
                .rejectionReason(o.getRejectionReason())
                .totalAmount(o.getTotalAmount())
                .notes(o.getNotes())
                .approvedById(o.getApprovedBy() != null ? o.getApprovedBy().getId() : null)
                .approvedByName(o.getApprovedBy() != null ? o.getApprovedBy().getFullName() : null)
                .approvedAt(o.getApprovedAt())
                .items(items)
                .build();
    }
}
`);

writeFile('sales/controller/SalesOrderController.java', `
package com.orderaudit.sales.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.sales.dto.CreateOrderRequest;
import com.orderaudit.sales.dto.OrderApprovalRequest;
import com.orderaudit.sales.dto.SalesOrderDto;
import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.service.SalesOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class SalesOrderController {
    private final SalesOrderService salesOrderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SALESMAN', 'ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<SalesOrderDto>> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long salesmanId = userPrincipal != null ? userPrincipal.getId() : 1L;
        return ResponseEntity.ok(ApiResponse.ok("Order placed successfully", salesOrderService.createOrder(req, salesmanId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SalesOrderDto>>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null && userPrincipal.getRole().name().equals("SALESMAN")) {
            return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getOrdersBySalesman(userPrincipal.getId())));
        }
        if (status != null) {
            return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getOrdersByStatus(status)));
        }
        return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getAllOrders()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SalesOrderDto>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getOrderById(id)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<SalesOrderDto>> approveOrder(
            @PathVariable Long id,
            @RequestBody OrderApprovalRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long adminId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Order status updated", salesOrderService.approveOrder(id, req, adminId)));
    }
}
`);

// 6. Invoices Module
writeFile('invoice/entity/GstType.java', `
package com.orderaudit.invoice.entity;

public enum GstType {
    INTRA_STATE,
    INTER_STATE
}
`);

writeFile('invoice/entity/InvoiceStatus.java', `
package com.orderaudit.invoice.entity;

public enum InvoiceStatus {
    DRAFT,
    POSTED,
    CANCELLED
}
`);

writeFile('invoice/entity/Invoice.java', `
package com.orderaudit.invoice.entity;

import com.orderaudit.customer.entity.Customer;
import com.orderaudit.sales.entity.SalesOrder;
import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "invoice_date", nullable = false)
    @Builder.Default
    private LocalDate invoiceDate = LocalDate.now();

    @Column(name = "financial_year", nullable = false, length = 10)
    private String financialYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "gst_type", nullable = false, length = 30)
    private GstType gstType;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "cgst_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal cgstRate = BigDecimal.ZERO;

    @Column(name = "cgst_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Column(name = "sgst_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal sgstRate = BigDecimal.ZERO;

    @Column(name = "sgst_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Column(name = "igst_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal igstRate = BigDecimal.ZERO;

    @Column(name = "igst_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Column(name = "total_tax", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalTax;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "amount_paid", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "amount_due", nullable = false, precision = 14, scale = 2)
    private BigDecimal amountDue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.POSTED;

    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(name = "company_gstin", length = 15)
    private String companyGstin;

    @Column(name = "company_address", columnDefinition = "TEXT")
    private String companyAddress;

    @Column(name = "company_state", length = 50)
    private String companyState;

    @Column(name = "company_state_code", length = 2)
    private String companyStateCode;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "customer_gstin", length = 15)
    private String customerGstin;

    @Column(name = "customer_address", columnDefinition = "TEXT")
    private String customerAddress;

    @Column(name = "customer_state", length = 50)
    private String customerState;

    @Column(name = "customer_state_code", length = 2)
    private String customerStateCode;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
`);

writeFile('invoice/entity/InvoiceItem.java', `
package com.orderaudit.invoice.entity;

import com.orderaudit.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "hsn_code", length = 20)
    private String hsnCode;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "taxable_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal taxableValue;

    @Column(name = "gst_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(name = "cgst_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Column(name = "sgst_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Column(name = "igst_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

writeFile('invoice/entity/InvoiceSequence.java', `
package com.orderaudit.invoice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "invoice_sequences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceSequence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "financial_year", nullable = false, unique = true, length = 10)
    private String financialYear;

    @Column(name = "last_number", nullable = false)
    @Builder.Default
    private int lastNumber = 0;

    @Column(length = 10)
    @Builder.Default
    private String prefix = "INV";
}
`);

// 7. Invoice Repositories
writeFile('invoice/repository/InvoiceRepository.java', `
package com.orderaudit.invoice.repository;

import com.orderaudit.invoice.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findBySalesOrderId(Long salesOrderId);
    List<Invoice> findByCustomerIdOrderByInvoiceDateDesc(Long customerId);
    List<Invoice> findByInvoiceDateBetweenOrderByInvoiceDateDesc(LocalDate from, LocalDate to);
    List<Invoice> findByFinancialYear(String financialYear);
    List<Invoice> findByAmountDueGreaterThanOrderByInvoiceDateAsc(java.math.BigDecimal zero);
}
`);

writeFile('invoice/repository/InvoiceItemRepository.java', `
package com.orderaudit.invoice.repository;

import com.orderaudit.invoice.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {
    List<InvoiceItem> findByInvoiceId(Long invoiceId);
}
`);

writeFile('invoice/repository/InvoiceSequenceRepository.java', `
package com.orderaudit.invoice.repository;

import com.orderaudit.invoice.entity.InvoiceSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceSequenceRepository extends JpaRepository<InvoiceSequence, Long> {
    Optional<InvoiceSequence> findByFinancialYear(String financialYear);
}
`);

// 8. Invoice DTOs
writeFile('invoice/dto/InvoiceItemDto.java', `
package com.orderaudit.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String hsnCode;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxableValue;
    private BigDecimal gstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal totalAmount;
}
`);

writeFile('invoice/dto/InvoiceDto.java', `
package com.orderaudit.invoice.dto;

import com.orderaudit.invoice.entity.GstType;
import com.orderaudit.invoice.entity.InvoiceStatus;
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
public class InvoiceDto {
    private Long id;
    private String invoiceNumber;
    private Long salesOrderId;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerGstin;
    private LocalDate invoiceDate;
    private String financialYear;
    private GstType gstType;
    private BigDecimal subtotal;
    private BigDecimal cgstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstRate;
    private BigDecimal sgstAmount;
    private BigDecimal igstRate;
    private BigDecimal igstAmount;
    private BigDecimal totalTax;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal amountDue;
    private InvoiceStatus status;
    private String companyName;
    private String companyGstin;
    private String companyAddress;
    private List<InvoiceItemDto> items;
}
`);

writeFile('invoice/dto/CreateInvoiceRequest.java', `
package com.orderaudit.invoice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {
    @NotNull(message = "Sales order ID is required")
    private Long salesOrderId;
}
`);

// 9. Invoice Service and Controller
writeFile('invoice/service/InvoiceService.java', `
package com.orderaudit.invoice.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.config.AppProperties;
import com.orderaudit.customer.entity.Customer;
import com.orderaudit.invoice.dto.CreateInvoiceRequest;
import com.orderaudit.invoice.dto.InvoiceDto;
import com.orderaudit.invoice.dto.InvoiceItemDto;
import com.orderaudit.invoice.entity.*;
import com.orderaudit.invoice.repository.InvoiceRepository;
import com.orderaudit.invoice.repository.InvoiceSequenceRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.entity.SalesOrder;
import com.orderaudit.sales.entity.SalesOrderItem;
import com.orderaudit.sales.repository.SalesOrderRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final InvoiceSequenceRepository sequenceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional
    public InvoiceDto generateInvoice(CreateInvoiceRequest req, Long userId) {
        SalesOrder order = salesOrderRepository.findById(req.getSalesOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", req.getSalesOrderId()));

        if (order.getStatus() != OrderStatus.APPROVED) {
            throw new BusinessException("Cannot generate invoice for order in status: " + order.getStatus() + ". Order must be APPROVED.");
        }

        // Check if invoice already exists
        if (invoiceRepository.findBySalesOrderId(order.getId()).isPresent()) {
            throw new BusinessException("Invoice already exists for order " + order.getOrderNumber());
        }

        Customer customer = order.getCustomer();
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        LocalDate today = LocalDate.now();

        // Financial year calculation: e.g. 2024-25
        String fy = getFinancialYear(today);

        // Sequence numbering
        InvoiceSequence seq = sequenceRepository.findByFinancialYear(fy)
                .orElseGet(() -> InvoiceSequence.builder().financialYear(fy).lastNumber(0).prefix("INV").build());
        seq.setLastNumber(seq.getLastNumber() + 1);
        sequenceRepository.save(seq);

        String invoiceNumber = String.format("%s/%s/%03d", seq.getPrefix(), fy, seq.getLastNumber());

        // Determine GST type based on place of supply:
        // Intra-state if customer state code matches company state code (Tamil Nadu 33)
        // Inter-state if different (e.g. Karnataka 29)
        boolean isIntraState = appProperties.getCompany().getStateCode().equalsIgnoreCase(customer.getStateCode());
        GstType gstType = isIntraState ? GstType.INTRA_STATE : GstType.INTER_STATE;

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalCgst = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;
        BigDecimal totalIgst = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();

        for (SalesOrderItem orderItem : order.getItems()) {
            Product prod = orderItem.getProduct();
            BigDecimal taxable = orderItem.getQuantity().multiply(orderItem.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(taxable);

            BigDecimal rate = prod.getGstRate() != null ? prod.getGstRate() : new BigDecimal("5.00");
            BigDecimal cgst = BigDecimal.ZERO;
            BigDecimal sgst = BigDecimal.ZERO;
            BigDecimal igst = BigDecimal.ZERO;

            if (isIntraState) {
                // Intra-state: CGST = rate/2, SGST = rate/2
                BigDecimal halfRate = rate.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP);
                cgst = taxable.multiply(halfRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                sgst = taxable.multiply(halfRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                totalCgst = totalCgst.add(cgst);
                totalSgst = totalSgst.add(sgst);
            } else {
                // Inter-state: IGST = full rate
                igst = taxable.multiply(rate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                totalIgst = totalIgst.add(igst);
            }

            BigDecimal itemTotal = taxable.add(cgst).add(sgst).add(igst);

            InvoiceItem invItem = InvoiceItem.builder()
                    .product(prod)
                    .hsnCode(prod.getHsnCode() != null ? prod.getHsnCode() : "2106")
                    .quantity(orderItem.getQuantity())
                    .unitPrice(orderItem.getUnitPrice())
                    .taxableValue(taxable)
                    .gstRate(rate)
                    .cgstAmount(cgst)
                    .sgstAmount(sgst)
                    .igstAmount(igst)
                    .totalAmount(itemTotal)
                    .build();

            items.add(invItem);
        }

        BigDecimal totalTax = totalCgst.add(totalSgst).add(totalIgst);
        BigDecimal grandTotal = subtotal.add(totalTax);

        BigDecimal cgstRate = isIntraState ? appProperties.getGst().getDefaultRate().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal sgstRate = isIntraState ? appProperties.getGst().getDefaultRate().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal igstRate = !isIntraState ? appProperties.getGst().getDefaultRate() : BigDecimal.ZERO;

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .salesOrder(order)
                .customer(customer)
                .invoiceDate(today)
                .financialYear(fy)
                .gstType(gstType)
                .subtotal(subtotal)
                .cgstRate(cgstRate)
                .cgstAmount(totalCgst)
                .sgstRate(sgstRate)
                .sgstAmount(totalSgst)
                .igstRate(igstRate)
                .igstAmount(totalIgst)
                .totalTax(totalTax)
                .totalAmount(grandTotal)
                .amountPaid(BigDecimal.ZERO)
                .amountDue(grandTotal)
                .status(InvoiceStatus.POSTED)
                .companyName(appProperties.getCompany().getName())
                .companyGstin(appProperties.getCompany().getGstin())
                .companyAddress(appProperties.getCompany().getAddress())
                .companyState(appProperties.getCompany().getState())
                .companyStateCode(appProperties.getCompany().getStateCode())
                .customerName(customer.getName())
                .customerGstin(customer.getGstin())
                .customerAddress(customer.getAddress())
                .customerState(customer.getState())
                .customerStateCode(customer.getStateCode())
                .createdBy(user)
                .build();

        for (InvoiceItem item : items) {
            item.setInvoice(invoice);
        }
        invoice.setItems(items);

        Invoice saved = invoiceRepository.save(invoice);

        // Update sales order status to INVOICED
        order.setStatus(OrderStatus.INVOICED);
        salesOrderRepository.save(order);

        return toDto(saved);
    }

    public InvoiceDto getInvoiceById(Long id) {
        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return toDto(inv);
    }

    public List<InvoiceDto> getAllInvoices() {
        return invoiceRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<InvoiceDto> getInvoicesByCustomer(Long customerId) {
        return invoiceRepository.findByCustomerIdOrderByInvoiceDateDesc(customerId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private String getFinancialYear(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();
        if (month >= 4) {
            return String.format("%d-%02d", year, (year + 1) % 100);
        } else {
            return String.format("%d-%02d", year - 1, year % 100);
        }
    }

    public InvoiceDto toDto(Invoice inv) {
        List<InvoiceItemDto> items = inv.getItems() != null ? inv.getItems().stream().map(i ->
                InvoiceItemDto.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productName(i.getProduct().getName())
                        .hsnCode(i.getHsnCode())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .taxableValue(i.getTaxableValue())
                        .gstRate(i.getGstRate())
                        .cgstAmount(i.getCgstAmount())
                        .sgstAmount(i.getSgstAmount())
                        .igstAmount(i.getIgstAmount())
                        .totalAmount(i.getTotalAmount())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return InvoiceDto.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .salesOrderId(inv.getSalesOrder().getId())
                .orderNumber(inv.getSalesOrder().getOrderNumber())
                .customerId(inv.getCustomer().getId())
                .customerName(inv.getCustomerName())
                .customerGstin(inv.getCustomerGstin())
                .invoiceDate(inv.getInvoiceDate())
                .financialYear(inv.getFinancialYear())
                .gstType(inv.getGstType())
                .subtotal(inv.getSubtotal())
                .cgstRate(inv.getCgstRate())
                .cgstAmount(inv.getCgstAmount())
                .sgstRate(inv.getSgstRate())
                .sgstAmount(inv.getSgstAmount())
                .igstRate(inv.getIgstRate())
                .igstAmount(inv.getIgstAmount())
                .totalTax(inv.getTotalTax())
                .totalAmount(inv.getTotalAmount())
                .amountPaid(inv.getAmountPaid())
                .amountDue(inv.getAmountDue())
                .status(inv.getStatus())
                .companyName(inv.getCompanyName())
                .companyGstin(inv.getCompanyGstin())
                .companyAddress(inv.getCompanyAddress())
                .items(items)
                .build();
    }
}
`);

// 10. Invoice PDF Service using OpenPDF
writeFile('invoice/service/InvoicePdfService.java', `
package com.orderaudit.invoice.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.invoice.entity.GstType;
import com.orderaudit.invoice.entity.Invoice;
import com.orderaudit.invoice.entity.InvoiceItem;
import com.orderaudit.invoice.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
public class InvoicePdfService {
    private final InvoiceRepository invoiceRepository;

    public byte[] generatePdf(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);

            // Header: Company Details
            Paragraph companyTitle = new Paragraph(invoice.getCompanyName() != null ? invoice.getCompanyName() : "Manufacturing Company", headerFont);
            companyTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(companyTitle);

            Paragraph companyDetails = new Paragraph(
                    (invoice.getCompanyAddress() != null ? invoice.getCompanyAddress() : "") +
                            "\\nState: " + invoice.getCompanyState() + " (" + invoice.getCompanyStateCode() + ") | GSTIN: " + invoice.getCompanyGstin(),
                    regularFont
            );
            companyDetails.setAlignment(Element.ALIGN_CENTER);
            document.add(companyDetails);

            document.add(new Paragraph(" "));

            Paragraph taxInvoiceTitle = new Paragraph("TAX INVOICE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLUE));
            taxInvoiceTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(taxInvoiceTitle);

            document.add(new Paragraph(" "));

            // Two-column table: Invoice info on Left, Customer info on Right
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);

            PdfPCell cellLeft = new PdfPCell();
            cellLeft.setBorder(Rectangle.NO_BORDER);
            cellLeft.addElement(new Paragraph("Invoice No: " + invoice.getInvoiceNumber(), boldFont));
            cellLeft.addElement(new Paragraph("Invoice Date: " + invoice.getInvoiceDate(), regularFont));
            cellLeft.addElement(new Paragraph("Financial Year: " + invoice.getFinancialYear(), regularFont));
            cellLeft.addElement(new Paragraph("GST Type: " + invoice.getGstType(), regularFont));
            metaTable.addCell(cellLeft);

            PdfPCell cellRight = new PdfPCell();
            cellRight.setBorder(Rectangle.NO_BORDER);
            cellRight.addElement(new Paragraph("Billed To (Customer):", boldFont));
            cellRight.addElement(new Paragraph(invoice.getCustomerName(), boldFont));
            cellRight.addElement(new Paragraph(invoice.getCustomerAddress() != null ? invoice.getCustomerAddress() : "", regularFont));
            cellRight.addElement(new Paragraph("State: " + invoice.getCustomerState() + " (" + invoice.getCustomerStateCode() + ")", regularFont));
            cellRight.addElement(new Paragraph("GSTIN: " + (invoice.getCustomerGstin() != null ? invoice.getCustomerGstin() : "Unregistered"), regularFont));
            metaTable.addCell(cellRight);

            document.add(metaTable);
            document.add(new Paragraph(" "));

            // Items Table
            boolean isIntra = invoice.getGstType() == GstType.INTRA_STATE;
            int numCols = isIntra ? 8 : 7;
            PdfPTable table = new PdfPTable(numCols);
            table.setWidthPercentage(100);

            // Header row
            String[] headers = isIntra ?
                    new String[]{"#", "Product", "HSN", "Qty", "Rate", "Taxable", "CGST", "SGST"} :
                    new String[]{"#", "Product", "HSN", "Qty", "Rate", "Taxable", "IGST"};

            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, boldFont));
                cell.setBackgroundColor(new Color(230, 235, 245));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            int index = 1;
            for (InvoiceItem item : invoice.getItems()) {
                table.addCell(new Phrase(String.valueOf(index++), regularFont));
                table.addCell(new Phrase(item.getProduct().getName(), regularFont));
                table.addCell(new Phrase(item.getHsnCode(), regularFont));
                table.addCell(new Phrase(item.getQuantity().toString(), regularFont));
                table.addCell(new Phrase("₹" + item.getUnitPrice(), regularFont));
                table.addCell(new Phrase("₹" + item.getTaxableValue(), regularFont));
                if (isIntra) {
                    table.addCell(new Phrase("₹" + item.getCgstAmount(), regularFont));
                    table.addCell(new Phrase("₹" + item.getSgstAmount(), regularFont));
                } else {
                    table.addCell(new Phrase("₹" + item.getIgstAmount(), regularFont));
                }
            }

            document.add(table);
            document.add(new Paragraph(" "));

            // Totals Table
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(40);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            totalsTable.addCell(new Phrase("Subtotal:", boldFont));
            totalsTable.addCell(new Phrase("₹" + invoice.getSubtotal(), regularFont));

            if (isIntra) {
                totalsTable.addCell(new Phrase("CGST (" + invoice.getCgstRate() + "%):", boldFont));
                totalsTable.addCell(new Phrase("₹" + invoice.getCgstAmount(), regularFont));

                totalsTable.addCell(new Phrase("SGST (" + invoice.getSgstRate() + "%):", boldFont));
                totalsTable.addCell(new Phrase("₹" + invoice.getSgstAmount(), regularFont));
            } else {
                totalsTable.addCell(new Phrase("IGST (" + invoice.getIgstRate() + "%):", boldFont));
                totalsTable.addCell(new Phrase("₹" + invoice.getIgstAmount(), regularFont));
            }

            totalsTable.addCell(new Phrase("Total Tax:", boldFont));
            totalsTable.addCell(new Phrase("₹" + invoice.getTotalTax(), regularFont));

            PdfPCell grandTitle = new PdfPCell(new Phrase("Total Amount:", boldFont));
            grandTitle.setBackgroundColor(new Color(230, 240, 255));
            PdfPCell grandValue = new PdfPCell(new Phrase("₹" + invoice.getTotalAmount(), boldFont));
            grandValue.setBackgroundColor(new Color(230, 240, 255));

            totalsTable.addCell(grandTitle);
            totalsTable.addCell(grandValue);

            document.add(totalsTable);

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating invoice PDF", e);
        }

        return out.toByteArray();
    }
}
`);

writeFile('invoice/controller/InvoiceController.java', `
package com.orderaudit.invoice.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.invoice.dto.CreateInvoiceRequest;
import com.orderaudit.invoice.dto.InvoiceDto;
import com.orderaudit.invoice.service.InvoicePdfService;
import com.orderaudit.invoice.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {
    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<InvoiceDto>> generateInvoice(
            @Valid @RequestBody CreateInvoiceRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Invoice generated successfully", invoiceService.generateInvoice(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvoiceDto>>> getAllInvoices() {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getAllInvoices()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceDto>> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoiceById(id)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<InvoiceDto>>> getInvoicesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.ok(invoiceService.getInvoicesByCustomer(customerId)));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Long id) {
        byte[] pdfBytes = invoicePdfService.generatePdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
`);

// 11. Dispatch Module
writeFile('sales/entity/Dispatch.java', `
package com.orderaudit.sales.entity;

import com.orderaudit.customer.entity.Customer;
import com.orderaudit.invoice.entity.Invoice;
import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dispatches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dispatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispatch_number", nullable = false, unique = true, length = 30)
    private String dispatchNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "dispatch_date", nullable = false)
    @Builder.Default
    private LocalDate dispatchDate = LocalDate.now();

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "dispatch", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DispatchItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

writeFile('sales/entity/DispatchItem.java', `
package com.orderaudit.sales.entity;

import com.orderaudit.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispatch_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatch_id", nullable = false)
    private Dispatch dispatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

writeFile('sales/repository/DispatchRepository.java', `
package com.orderaudit.sales.repository;

import com.orderaudit.sales.entity.Dispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, Long> {
    Optional<Dispatch> findByDispatchNumber(String dispatchNumber);
    List<Dispatch> findByCustomerIdOrderByDispatchDateDesc(Long customerId);
    List<Dispatch> findByDispatchDateBetweenOrderByDispatchDateDesc(LocalDate from, LocalDate to);
    long countByDispatchDate(LocalDate date);
}
`);

writeFile('sales/repository/DispatchItemRepository.java', `
package com.orderaudit.sales.repository;

import com.orderaudit.sales.entity.DispatchItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DispatchItemRepository extends JpaRepository<DispatchItem, Long> {
    List<DispatchItem> findByDispatchId(Long dispatchId);
}
`);

writeFile('sales/dto/DispatchItemDto.java', `
package com.orderaudit.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal quantity;
}
`);

writeFile('sales/dto/DispatchDto.java', `
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
`);

writeFile('sales/dto/CreateDispatchRequest.java', `
package com.orderaudit.sales.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDispatchRequest {
    @NotNull(message = "Invoice ID is required")
    private Long invoiceId;

    private String notes;
}
`);

writeFile('sales/service/DispatchService.java', `
package com.orderaudit.sales.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.InsufficientStockException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.invoice.entity.Invoice;
import com.orderaudit.invoice.entity.InvoiceItem;
import com.orderaudit.invoice.repository.InvoiceRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.sales.dto.CreateDispatchRequest;
import com.orderaudit.sales.dto.DispatchDto;
import com.orderaudit.sales.dto.DispatchItemDto;
import com.orderaudit.sales.entity.Dispatch;
import com.orderaudit.sales.entity.DispatchItem;
import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.entity.SalesOrder;
import com.orderaudit.sales.repository.DispatchRepository;
import com.orderaudit.sales.repository.SalesOrderRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DispatchService {
    private final DispatchRepository dispatchRepository;
    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;

    @Transactional
    public DispatchDto createDispatch(CreateDispatchRequest req, Long userId) {
        Invoice invoice = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", req.getInvoiceId()));

        SalesOrder order = invoice.getSalesOrder();
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        LocalDate today = LocalDate.now();

        // 1. Stock Validation across all items first (prevent overselling)
        for (InvoiceItem item : invoice.getItems()) {
            Product prod = item.getProduct();
            BigDecimal available = inventoryService.getCurrentProductStock(prod.getId());
            if (available.compareTo(item.getQuantity()) < 0) {
                throw new InsufficientStockException(prod.getName(), available, item.getQuantity());
            }
        }

        String dispatchNumber = generateDispatchNumber(today);

        Dispatch dispatch = Dispatch.builder()
                .dispatchNumber(dispatchNumber)
                .invoice(invoice)
                .salesOrder(order)
                .customer(invoice.getCustomer())
                .dispatchDate(today)
                .notes(req.getNotes())
                .createdBy(user)
                .build();

        List<DispatchItem> dispatchItems = new ArrayList<>();
        for (InvoiceItem invItem : invoice.getItems()) {
            dispatchItems.add(DispatchItem.builder()
                    .dispatch(dispatch)
                    .product(invItem.getProduct())
                    .quantity(invItem.getQuantity())
                    .build());
        }

        dispatch.setItems(dispatchItems);
        Dispatch saved = dispatchRepository.save(dispatch);

        // 2. Reduce finished goods inventory through stock ledger movements
        for (DispatchItem di : saved.getItems()) {
            inventoryService.recordDispatch(
                    di.getProduct().getId(),
                    di.getQuantity(),
                    saved.getId(),
                    saved.getDispatchNumber(),
                    userId
            );
        }

        // 3. Update Sales Order status to DISPATCHED
        order.setStatus(OrderStatus.DISPATCHED);
        salesOrderRepository.save(order);

        return toDto(saved);
    }

    public DispatchDto getDispatchById(Long id) {
        Dispatch d = dispatchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispatch", "id", id));
        return toDto(d);
    }

    public List<DispatchDto> getAllDispatches() {
        return dispatchRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    private String generateDispatchNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = dispatchRepository.countByDispatchDate(date) + 1;
        return String.format("DSP-%s-%03d", dateStr, count);
    }

    private DispatchDto toDto(Dispatch d) {
        List<DispatchItemDto> items = d.getItems() != null ? d.getItems().stream().map(i ->
                DispatchItemDto.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productName(i.getProduct().getName())
                        .quantity(i.getQuantity())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return DispatchDto.builder()
                .id(d.getId())
                .dispatchNumber(d.getDispatchNumber())
                .invoiceId(d.getInvoice().getId())
                .invoiceNumber(d.getInvoice().getInvoiceNumber())
                .salesOrderId(d.getSalesOrder().getId())
                .orderNumber(d.getSalesOrder().getOrderNumber())
                .customerId(d.getCustomer().getId())
                .customerName(d.getCustomer().getName())
                .dispatchDate(d.getDispatchDate())
                .notes(d.getNotes())
                .items(items)
                .build();
    }
}
`);

writeFile('sales/controller/DispatchController.java', `
package com.orderaudit.sales.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.sales.dto.CreateDispatchRequest;
import com.orderaudit.sales.dto.DispatchDto;
import com.orderaudit.sales.service.DispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatches")
@RequiredArgsConstructor
public class DispatchController {
    private final DispatchService dispatchService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<DispatchDto>> createDispatch(
            @Valid @RequestBody CreateDispatchRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Dispatch completed successfully", dispatchService.createDispatch(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DispatchDto>>> getAllDispatches() {
        return ResponseEntity.ok(ApiResponse.ok(dispatchService.getAllDispatches()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DispatchDto>> getDispatchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(dispatchService.getDispatchById(id)));
    }
}
`);

// 12. Payments Module
writeFile('payment/entity/PaymentMethod.java', `
package com.orderaudit.payment.entity;

public enum PaymentMethod {
    CASH,
    CHEQUE,
    BANK_TRANSFER,
    UPI,
    OTHER
}
`);

writeFile('payment/entity/Payment.java', `
package com.orderaudit.payment.entity;

import com.orderaudit.customer.entity.Customer;
import com.orderaudit.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_number", nullable = false, unique = true, length = 30)
    private String paymentNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_date", nullable = false)
    @Builder.Default
    private LocalDate paymentDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Column(name = "reference_number", length = 50)
    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by")
    private User receivedBy;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PaymentAllocation> allocations = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
`);

writeFile('payment/entity/PaymentAllocation.java', `
package com.orderaudit.payment.entity;

import com.orderaudit.invoice.entity.Invoice;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_allocations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"payment_id", "invoice_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAllocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "allocated_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal allocatedAmount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
`);

writeFile('payment/repository/PaymentRepository.java', `
package com.orderaudit.payment.repository;

import com.orderaudit.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentNumber(String paymentNumber);
    List<Payment> findByCustomerIdOrderByPaymentDateDesc(Long customerId);
    List<Payment> findByPaymentDateBetweenOrderByPaymentDateDesc(LocalDate from, LocalDate to);
    long countByPaymentDate(LocalDate date);
}
`);

writeFile('payment/repository/PaymentAllocationRepository.java', `
package com.orderaudit.payment.repository;

import com.orderaudit.payment.entity.PaymentAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, Long> {
    List<PaymentAllocation> findByPaymentId(Long paymentId);
    List<PaymentAllocation> findByInvoiceId(Long invoiceId);
}
`);

writeFile('payment/dto/PaymentAllocationRequest.java', `
package com.orderaudit.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAllocationRequest {
    @NotNull(message = "Invoice ID is required")
    private Long invoiceId;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;
}
`);

writeFile('payment/dto/CreatePaymentRequest.java', `
package com.orderaudit.payment.dto;

import com.orderaudit.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
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
public class CreatePaymentRequest {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Payment amount is required")
    private BigDecimal amount;

    private LocalDate paymentDate;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private String notes;

    private List<PaymentAllocationRequest> allocations;
}
`);

writeFile('payment/dto/PaymentAllocationDto.java', `
package com.orderaudit.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAllocationDto {
    private Long id;
    private Long invoiceId;
    private String invoiceNumber;
    private BigDecimal allocatedAmount;
}
`);

writeFile('payment/dto/PaymentDto.java', `
package com.orderaudit.payment.dto;

import com.orderaudit.payment.entity.PaymentMethod;
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
public class PaymentDto {
    private Long id;
    private String paymentNumber;
    private Long customerId;
    private String customerName;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private String notes;
    private List<PaymentAllocationDto> allocations;
}
`);

writeFile('payment/dto/OutstandingDto.java', `
package com.orderaudit.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingDto {
    private Long customerId;
    private String customerName;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private BigDecimal totalOutstanding;
    private BigDecimal bucket0_30;
    private BigDecimal bucket31_60;
    private BigDecimal bucket61_90;
    private BigDecimal bucketOver90;
}
`);

writeFile('payment/service/PaymentService.java', `
package com.orderaudit.payment.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.customer.entity.Customer;
import com.orderaudit.customer.repository.CustomerRepository;
import com.orderaudit.invoice.entity.Invoice;
import com.orderaudit.invoice.repository.InvoiceRepository;
import com.orderaudit.payment.dto.*;
import com.orderaudit.payment.entity.Payment;
import com.orderaudit.payment.entity.PaymentAllocation;
import com.orderaudit.payment.entity.PaymentMethod;
import com.orderaudit.payment.repository.PaymentRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @Transactional
    public PaymentDto recordPayment(CreatePaymentRequest req, Long userId) {
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", req.getCustomerId()));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        LocalDate date = req.getPaymentDate() != null ? req.getPaymentDate() : LocalDate.now();

        String paymentNumber = generatePaymentNumber(date);

        Payment payment = Payment.builder()
                .paymentNumber(paymentNumber)
                .customer(customer)
                .amount(req.getAmount())
                .paymentDate(date)
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : PaymentMethod.CASH)
                .referenceNumber(req.getReferenceNumber())
                .notes(req.getNotes())
                .receivedBy(user)
                .build();

        Payment saved = paymentRepository.save(payment);

        List<PaymentAllocation> allocationList = new ArrayList<>();
        BigDecimal remainingToAllocate = req.getAmount();

        if (req.getAllocations() != null && !req.getAllocations().isEmpty()) {
            for (PaymentAllocationRequest allocReq : req.getAllocations()) {
                Invoice inv = invoiceRepository.findById(allocReq.getInvoiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", allocReq.getInvoiceId()));

                if (!inv.getCustomer().getId().equals(customer.getId())) {
                    throw new BusinessException("Invoice " + inv.getInvoiceNumber() + " does not belong to customer " + customer.getName());
                }

                BigDecimal allocAmount = allocReq.getAmount();
                if (allocAmount.compareTo(inv.getAmountDue()) > 0) {
                    throw new BusinessException("Allocated amount cannot exceed invoice amount due of ₹" + inv.getAmountDue());
                }

                inv.setAmountPaid(inv.getAmountPaid().add(allocAmount));
                inv.setAmountDue(inv.getAmountDue().subtract(allocAmount));
                invoiceRepository.save(inv);

                allocationList.add(PaymentAllocation.builder()
                        .payment(saved)
                        .invoice(inv)
                        .allocatedAmount(allocAmount)
                        .build());
            }
        } else {
            // Auto-allocate to oldest unpaid invoices
            List<Invoice> unpaidInvoices = invoiceRepository.findByCustomerIdOrderByInvoiceDateDesc(customer.getId()).stream()
                    .filter(i -> i.getAmountDue().compareTo(BigDecimal.ZERO) > 0)
                    .sorted((a, b) -> a.getInvoiceDate().compareTo(b.getInvoiceDate()))
                    .collect(Collectors.toList());

            for (Invoice inv : unpaidInvoices) {
                if (remainingToAllocate.compareTo(BigDecimal.ZERO) <= 0) break;

                BigDecimal allocate = remainingToAllocate.min(inv.getAmountDue());
                inv.setAmountPaid(inv.getAmountPaid().add(allocate));
                inv.setAmountDue(inv.getAmountDue().subtract(allocate));
                invoiceRepository.save(inv);

                allocationList.add(PaymentAllocation.builder()
                        .payment(saved)
                        .invoice(inv)
                        .allocatedAmount(allocate)
                        .build());

                remainingToAllocate = remainingToAllocate.subtract(allocate);
            }
        }

        saved.setAllocations(allocationList);
        return toDto(paymentRepository.save(saved));
    }

    public PaymentDto getPaymentById(Long id) {
        Payment p = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        return toDto(p);
    }

    public List<PaymentDto> getAllPayments() {
        return paymentRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<PaymentDto> getPaymentsByCustomer(Long customerId) {
        return paymentRepository.findByCustomerIdOrderByPaymentDateDesc(customerId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public OutstandingDto getCustomerOutstanding(Long customerId) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        List<Invoice> invoices = invoiceRepository.findByCustomerIdOrderByInvoiceDateDesc(customerId);

        BigDecimal totalInvoiced = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalDue = BigDecimal.ZERO;

        BigDecimal b0_30 = BigDecimal.ZERO;
        BigDecimal b31_60 = BigDecimal.ZERO;
        BigDecimal b61_90 = BigDecimal.ZERO;
        BigDecimal bOver90 = BigDecimal.ZERO;

        LocalDate today = LocalDate.now();

        for (Invoice inv : invoices) {
            totalInvoiced = totalInvoiced.add(inv.getTotalAmount());
            totalPaid = totalPaid.add(inv.getAmountPaid());
            totalDue = totalDue.add(inv.getAmountDue());

            if (inv.getAmountDue().compareTo(BigDecimal.ZERO) > 0) {
                long days = ChronoUnit.DAYS.between(inv.getInvoiceDate(), today);
                if (days <= 30) {
                    b0_30 = b0_30.add(inv.getAmountDue());
                } else if (days <= 60) {
                    b31_60 = b31_60.add(inv.getAmountDue());
                } else if (days <= 90) {
                    b61_90 = b61_90.add(inv.getAmountDue());
                } else {
                    bOver90 = bOver90.add(inv.getAmountDue());
                }
            }
        }

        return OutstandingDto.builder()
                .customerId(c.getId())
                .customerName(c.getName())
                .totalInvoiced(totalInvoiced)
                .totalPaid(totalPaid)
                .totalOutstanding(totalDue)
                .bucket0_30(b0_30)
                .bucket31_60(b31_60)
                .bucket61_90(b61_90)
                .bucketOver90(bOver90)
                .build();
    }

    public List<OutstandingDto> getAllOutstandings() {
        return customerRepository.findByActiveTrue().stream()
                .map(c -> getCustomerOutstanding(c.getId()))
                .collect(Collectors.toList());
    }

    private String generatePaymentNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = paymentRepository.countByPaymentDate(date) + 1;
        return String.format("PAY-%s-%03d", dateStr, count);
    }

    private PaymentDto toDto(Payment p) {
        List<PaymentAllocationDto> allocs = p.getAllocations() != null ? p.getAllocations().stream().map(a ->
                PaymentAllocationDto.builder()
                        .id(a.getId())
                        .invoiceId(a.getInvoice().getId())
                        .invoiceNumber(a.getInvoice().getInvoiceNumber())
                        .allocatedAmount(a.getAllocatedAmount())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return PaymentDto.builder()
                .id(p.getId())
                .paymentNumber(p.getPaymentNumber())
                .customerId(p.getCustomer().getId())
                .customerName(p.getCustomer().getName())
                .amount(p.getAmount())
                .paymentDate(p.getPaymentDate())
                .paymentMethod(p.getPaymentMethod())
                .referenceNumber(p.getReferenceNumber())
                .notes(p.getNotes())
                .allocations(allocs)
                .build();
    }
}
`);

writeFile('payment/controller/PaymentController.java', `
package com.orderaudit.payment.controller;

import com.orderaudit.auth.security.UserPrincipal;
import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.payment.dto.CreatePaymentRequest;
import com.orderaudit.payment.dto.OutstandingDto;
import com.orderaudit.payment.dto.PaymentDto;
import com.orderaudit.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PaymentDto>> recordPayment(
            @Valid @RequestBody CreatePaymentRequest req,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("Payment recorded successfully", paymentService.recordPayment(req, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentDto>>> getAllPayments(@RequestParam(required = false) Long customerId) {
        List<PaymentDto> list = customerId != null ?
                paymentService.getPaymentsByCustomer(customerId) :
                paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentById(id)));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<List<OutstandingDto>>> getAllOutstandings() {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getAllOutstandings()));
    }

    @GetMapping("/outstanding/{customerId}")
    public ResponseEntity<ApiResponse<OutstandingDto>> getCustomerOutstanding(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getCustomerOutstanding(customerId)));
    }
}
`);

// 13. Costing Module
writeFile('costing/dto/MaterialCostDto.java', `
package com.orderaudit.costing.dto;

import com.orderaudit.inventory.entity.UnitOfMeasure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialCostDto {
    private String materialName;
    private BigDecimal quantity;
    private UnitOfMeasure unit;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
}
`);

writeFile('costing/dto/CostingDto.java', `
package com.orderaudit.costing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostingDto {
    private Long runId;
    private String runNumber;
    private String productName;
    private List<MaterialCostDto> rawMaterials;
    private List<MaterialCostDto> packagingMaterials;
    private BigDecimal totalMaterialCost;
    private BigDecimal totalPackagingCost;
    private BigDecimal labourCost;
    private BigDecimal gasPowerCost;
    private BigDecimal otherOverheadCost;
    private BigDecimal totalProductionCost;
    private BigDecimal actualGoodOutput;
    private BigDecimal costPerPacket;
    private BigDecimal sellingPrice;
    private BigDecimal grossMargin;
    private BigDecimal marginPercentage;
}
`);

writeFile('costing/dto/MarginReportDto.java', `
package com.orderaudit.costing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarginReportDto {
    private Long productId;
    private String productName;
    private BigDecimal sellingPrice;
    private BigDecimal avgCostPerPacket;
    private BigDecimal grossMargin;
    private BigDecimal marginPercentage;
}
`);

writeFile('costing/service/CostingService.java', `
package com.orderaudit.costing.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.costing.dto.CostingDto;
import com.orderaudit.costing.dto.MarginReportDto;
import com.orderaudit.costing.dto.MaterialCostDto;
import com.orderaudit.inventory.entity.ItemType;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.entity.ProductionMaterialIssue;
import com.orderaudit.production.entity.ProductionRun;
import com.orderaudit.production.repository.ProductionRunRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CostingService {
    private final ProductionRunRepository productionRunRepository;
    private final ProductRepository productRepository;

    public CostingDto getCostingForRun(Long productionRunId) {
        ProductionRun run = productionRunRepository.findById(productionRunId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionRun", "id", productionRunId));

        Product product = run.getProduct();
        List<MaterialCostDto> rawMaterials = new ArrayList<>();
        List<MaterialCostDto> packaging = new ArrayList<>();

        for (ProductionMaterialIssue issue : run.getMaterialIssues()) {
            BigDecimal totalConsumed = issue.getActualQuantity().add(issue.getDamagedQuantity() != null ? issue.getDamagedQuantity() : BigDecimal.ZERO);
            MaterialCostDto dto = MaterialCostDto.builder()
                    .materialName(issue.getInventoryItem().getName())
                    .quantity(totalConsumed)
                    .unit(issue.getUnit())
                    .unitCost(issue.getUnitCost())
                    .totalCost(issue.getTotalCost())
                    .build();

            if (issue.getInventoryItem().getItemType() == ItemType.RAW_MATERIAL) {
                rawMaterials.add(dto);
            } else {
                packaging.add(dto);
            }
        }

        BigDecimal sellingPrice = product.getSellingPrice();
        BigDecimal costPerPacket = run.getCostPerPacket() != null ? run.getCostPerPacket() : BigDecimal.ZERO;
        BigDecimal grossMargin = sellingPrice.subtract(costPerPacket);
        BigDecimal marginPct = BigDecimal.ZERO;
        if (sellingPrice.compareTo(BigDecimal.ZERO) > 0) {
            marginPct = grossMargin.divide(sellingPrice, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
        }

        return CostingDto.builder()
                .runId(run.getId())
                .runNumber(run.getRunNumber())
                .productName(product.getName())
                .rawMaterials(rawMaterials)
                .packagingMaterials(packaging)
                .totalMaterialCost(run.getTotalMaterialCost())
                .totalPackagingCost(run.getTotalPackagingCost())
                .labourCost(run.getLabourCost())
                .gasPowerCost(run.getGasPowerCost())
                .otherOverheadCost(run.getOtherOverheadCost())
                .totalProductionCost(run.getTotalProductionCost())
                .actualGoodOutput(run.getActualGoodOutput())
                .costPerPacket(costPerPacket)
                .sellingPrice(sellingPrice)
                .grossMargin(grossMargin)
                .marginPercentage(marginPct)
                .build();
    }

    public List<MarginReportDto> getMarginReport() {
        List<Product> products = productRepository.findByActiveTrue();
        List<MarginReportDto> report = new ArrayList<>();

        for (Product p : products) {
            List<ProductionRun> runs = productionRunRepository.findByProductIdOrderByProductionDateDesc(p.getId());

            BigDecimal totalCost = BigDecimal.ZERO;
            long runCount = 0;
            for (ProductionRun r : runs) {
                if (r.getCostPerPacket() != null && r.getCostPerPacket().compareTo(BigDecimal.ZERO) > 0) {
                    totalCost = totalCost.add(r.getCostPerPacket());
                    runCount++;
                }
            }

            BigDecimal avgCost = runCount > 0 ? totalCost.divide(BigDecimal.valueOf(runCount), 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal margin = p.getSellingPrice().subtract(avgCost);
            BigDecimal marginPct = BigDecimal.ZERO;
            if (p.getSellingPrice().compareTo(BigDecimal.ZERO) > 0) {
                marginPct = margin.divide(p.getSellingPrice(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            }

            report.add(MarginReportDto.builder()
                    .productId(p.getId())
                    .productName(p.getName())
                    .sellingPrice(p.getSellingPrice())
                    .avgCostPerPacket(avgCost)
                    .grossMargin(margin)
                    .marginPercentage(marginPct)
                    .build());
        }

        return report;
    }
}
`);

writeFile('costing/controller/CostingController.java', `
package com.orderaudit.costing.controller;

import com.orderaudit.common.dto.ApiResponse;
import com.orderaudit.costing.dto.CostingDto;
import com.orderaudit.costing.dto.MarginReportDto;
import com.orderaudit.costing.service.CostingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/costing")
@RequiredArgsConstructor
public class CostingController {
    private final CostingService costingService;

    @GetMapping("/production/{runId}")
    public ResponseEntity<ApiResponse<CostingDto>> getCostingForRun(@PathVariable Long runId) {
        return ResponseEntity.ok(ApiResponse.ok(costingService.getCostingForRun(runId)));
    }

    @GetMapping("/margins")
    public ResponseEntity<ApiResponse<List<MarginReportDto>>> getMarginReport() {
        return ResponseEntity.ok(ApiResponse.ok(costingService.getMarginReport()));
    }
}
`);

console.log('Part 5 Sales, Invoices, Dispatches, Payments & Costing generated successfully!');


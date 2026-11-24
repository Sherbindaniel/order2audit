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
@Transactional(readOnly = true)
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

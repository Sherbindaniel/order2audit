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
@Transactional(readOnly = true)
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

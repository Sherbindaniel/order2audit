package com.orderaudit.purchase.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.inventory.service.InventoryService;
import com.orderaudit.purchase.dto.CreatePurchaseRequest;
import com.orderaudit.purchase.dto.PurchaseDto;
import com.orderaudit.purchase.dto.PurchaseItemDto;
import com.orderaudit.purchase.dto.PurchaseItemRequest;
import com.orderaudit.purchase.entity.Purchase;
import com.orderaudit.purchase.entity.PurchaseItem;
import com.orderaudit.purchase.entity.PurchaseStatus;
import com.orderaudit.purchase.repository.PurchaseRepository;
import com.orderaudit.supplier.entity.Supplier;
import com.orderaudit.supplier.repository.SupplierRepository;
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
public class PurchaseService {
    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;

    @Transactional
    public PurchaseDto createPurchase(CreatePurchaseRequest req, Long userId) {
        Supplier supplier = null;
        if (req.getSupplierId() != null) {
            supplier = supplierRepository.findById(req.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", req.getSupplierId()));
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        LocalDate date = req.getPurchaseDate() != null ? req.getPurchaseDate() : LocalDate.now();

        String purchaseNumber = generatePurchaseNumber(date);

        Purchase purchase = Purchase.builder()
                .purchaseNumber(purchaseNumber)
                .supplier(supplier)
                .purchaseDate(date)
                .totalAmount(BigDecimal.ZERO)
                .status(PurchaseStatus.RECEIVED)
                .notes(req.getNotes())
                .createdBy(user)
                .build();

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<PurchaseItem> itemList = new ArrayList<>();

        for (PurchaseItemRequest itemReq : req.getItems()) {
            InventoryItem invItem = inventoryItemRepository.findById(itemReq.getInventoryItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemReq.getInventoryItemId()));

            BigDecimal total = itemReq.getQuantity().multiply(itemReq.getUnitPrice());
            grandTotal = grandTotal.add(total);

            PurchaseItem pi = PurchaseItem.builder()
                    .purchase(purchase)
                    .inventoryItem(invItem)
                    .quantity(itemReq.getQuantity())
                    .unit(itemReq.getUnit())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(total)
                    .build();

            itemList.add(pi);
        }

        purchase.setTotalAmount(grandTotal);
        purchase.setItems(itemList);

        Purchase saved = purchaseRepository.save(purchase);

        // Record stock movements in the ledger for each purchased item
        for (PurchaseItem pi : saved.getItems()) {
            inventoryService.recordPurchaseReceipt(
                    pi.getInventoryItem().getId(),
                    pi.getQuantity(),
                    pi.getUnit(),
                    pi.getUnitPrice(),
                    saved.getId(),
                    saved.getPurchaseNumber(),
                    userId
            );
        }

        return toDto(saved);
    }

    public PurchaseDto getPurchaseById(Long id) {
        Purchase p = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", id));
        return toDto(p);
    }

    public List<PurchaseDto> getAllPurchases() {
        return purchaseRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<PurchaseDto> getPurchasesByDateRange(LocalDate from, LocalDate to) {
        return purchaseRepository.findByPurchaseDateBetweenOrderByPurchaseDateDesc(from, to)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private String generatePurchaseNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = purchaseRepository.countByPurchaseDate(date) + 1;
        return String.format("PUR-%s-%03d", dateStr, count);
    }

    private PurchaseDto toDto(Purchase p) {
        List<PurchaseItemDto> items = p.getItems() != null ? p.getItems().stream().map(i ->
                PurchaseItemDto.builder()
                        .id(i.getId())
                        .inventoryItemId(i.getInventoryItem().getId())
                        .inventoryItemName(i.getInventoryItem().getName())
                        .quantity(i.getQuantity())
                        .unit(i.getUnit())
                        .unitPrice(i.getUnitPrice())
                        .totalPrice(i.getTotalPrice())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return PurchaseDto.builder()
                .id(p.getId())
                .purchaseNumber(p.getPurchaseNumber())
                .supplierId(p.getSupplier() != null ? p.getSupplier().getId() : null)
                .supplierName(p.getSupplier() != null ? p.getSupplier().getName() : null)
                .purchaseDate(p.getPurchaseDate())
                .totalAmount(p.getTotalAmount())
                .status(p.getStatus())
                .notes(p.getNotes())
                .items(items)
                .build();
    }
}

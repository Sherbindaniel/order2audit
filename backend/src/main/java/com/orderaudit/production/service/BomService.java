package com.orderaudit.production.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import com.orderaudit.inventory.repository.InventoryItemRepository;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.repository.ProductRepository;
import com.orderaudit.production.dto.BomDto;
import com.orderaudit.production.dto.BomItemDto;
import com.orderaudit.production.dto.BomItemRequest;
import com.orderaudit.production.dto.CreateBomRequest;
import com.orderaudit.production.entity.Bom;
import com.orderaudit.production.entity.BomItem;
import com.orderaudit.production.repository.BomRepository;
import com.orderaudit.user.entity.User;
import com.orderaudit.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BomService {
    private final BomRepository bomRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final UserRepository userRepository;

    @Transactional
    public BomDto createBom(CreateBomRequest req, Long userId) {
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", req.getProductId()));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        // Deactivate previous active BOM for this product
        bomRepository.findByProductIdAndActiveTrue(product.getId()).ifPresent(oldBom -> {
            oldBom.setActive(false);
            bomRepository.save(oldBom);
        });

        int nextVersion = bomRepository.findMaxVersionForProduct(product.getId()) + 1;

        Bom bom = Bom.builder()
                .product(product)
                .version(nextVersion)
                .batchSize(req.getBatchSize())
                .batchUnit(req.getBatchUnit() != null ? req.getBatchUnit() : UnitOfMeasure.PACKET)
                .expectedOutput(req.getExpectedOutput())
                .outputUnit(req.getOutputUnit() != null ? req.getOutputUnit() : UnitOfMeasure.PACKET)
                .active(true)
                .notes(req.getNotes())
                .createdBy(user)
                .build();

        List<BomItem> items = new ArrayList<>();
        for (BomItemRequest itemReq : req.getItems()) {
            InventoryItem invItem = inventoryItemRepository.findById(itemReq.getInventoryItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", "id", itemReq.getInventoryItemId()));

            items.add(BomItem.builder()
                    .bom(bom)
                    .inventoryItem(invItem)
                    .quantity(itemReq.getQuantity())
                    .unit(itemReq.getUnit())
                    .notes(itemReq.getNotes())
                    .build());
        }

        bom.setItems(items);
        Bom saved = bomRepository.save(bom);
        return toDto(saved);
    }

    public BomDto getBomById(Long id) {
        Bom bom = bomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BOM", "id", id));
        return toDto(bom);
    }

    public BomDto getActiveBomForProduct(Long productId) {
        Bom bom = bomRepository.findByProductIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Active BOM for Product", "productId", productId));
        return toDto(bom);
    }

    public List<BomDto> getAllActiveBoms() {
        return bomRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public BomDto toDto(Bom bom) {
        List<BomItemDto> items = bom.getItems() != null ? bom.getItems().stream().map(i ->
                BomItemDto.builder()
                        .id(i.getId())
                        .inventoryItemId(i.getInventoryItem().getId())
                        .inventoryItemName(i.getInventoryItem().getName())
                        .itemType(i.getInventoryItem().getItemType())
                        .quantity(i.getQuantity())
                        .unit(i.getUnit())
                        .notes(i.getNotes())
                        .build()
        ).collect(Collectors.toList()) : new ArrayList<>();

        return BomDto.builder()
                .id(bom.getId())
                .productId(bom.getProduct().getId())
                .productName(bom.getProduct().getName())
                .version(bom.getVersion())
                .batchSize(bom.getBatchSize())
                .batchUnit(bom.getBatchUnit())
                .expectedOutput(bom.getExpectedOutput())
                .outputUnit(bom.getOutputUnit())
                .active(bom.isActive())
                .notes(bom.getNotes())
                .items(items)
                .build();
    }
}

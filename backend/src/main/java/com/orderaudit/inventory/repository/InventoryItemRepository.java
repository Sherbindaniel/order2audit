package com.orderaudit.inventory.repository;

import com.orderaudit.inventory.entity.InventoryItem;
import com.orderaudit.inventory.entity.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByItemType(ItemType itemType);
    List<InventoryItem> findByActiveTrue();
    Optional<InventoryItem> findByCode(String code);
    Optional<InventoryItem> findByName(String name);
}

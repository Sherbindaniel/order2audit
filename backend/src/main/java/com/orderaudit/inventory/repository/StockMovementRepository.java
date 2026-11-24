package com.orderaudit.inventory.repository;

import com.orderaudit.inventory.entity.MovementType;
import com.orderaudit.inventory.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByInventoryItemIdOrderByPerformedAtAsc(Long inventoryItemId);
    List<StockMovement> findByProductIdOrderByPerformedAtAsc(Long productId);
    List<StockMovement> findBySourceTypeAndSourceId(String sourceType, Long sourceId);
    List<StockMovement> findByMovementType(MovementType movementType);

    @Query("SELECT COALESCE(SUM(sm.quantity), 0) FROM StockMovement sm WHERE sm.inventoryItem.id = :itemId")
    BigDecimal getStockBalance(@Param("itemId") Long itemId);

    @Query("SELECT COALESCE(SUM(sm.quantity), 0) FROM StockMovement sm WHERE sm.product.id = :productId")
    BigDecimal getProductStockBalance(@Param("productId") Long productId);

    List<StockMovement> findByInventoryItemIdAndPerformedAtBetweenOrderByPerformedAtAsc(
            Long itemId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.inventoryItem.id = :itemId AND sm.quantity > 0 AND sm.unitCost IS NOT NULL")
    List<StockMovement> findPositiveMovementsForItem(@Param("itemId") Long itemId);

    List<StockMovement> findByPerformedAtBetweenOrderByPerformedAtDesc(LocalDateTime from, LocalDateTime to);
}

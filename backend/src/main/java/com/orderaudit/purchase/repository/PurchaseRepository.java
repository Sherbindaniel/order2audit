package com.orderaudit.purchase.repository;

import com.orderaudit.purchase.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    Optional<Purchase> findByPurchaseNumber(String purchaseNumber);
    List<Purchase> findByPurchaseDateBetweenOrderByPurchaseDateDesc(LocalDate from, LocalDate to);
    long countByPurchaseDate(LocalDate date);
}

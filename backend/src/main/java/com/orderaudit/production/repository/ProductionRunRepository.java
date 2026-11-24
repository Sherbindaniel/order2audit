package com.orderaudit.production.repository;

import com.orderaudit.production.entity.ProductionRun;
import com.orderaudit.production.entity.ProductionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionRunRepository extends JpaRepository<ProductionRun, Long> {
    Optional<ProductionRun> findByRunNumber(String runNumber);
    List<ProductionRun> findByProductIdOrderByProductionDateDesc(Long productId);
    List<ProductionRun> findByStatus(ProductionStatus status);
    List<ProductionRun> findByProductionDateBetweenOrderByProductionDateDesc(LocalDate from, LocalDate to);
    long countByProductionDate(LocalDate date);
}

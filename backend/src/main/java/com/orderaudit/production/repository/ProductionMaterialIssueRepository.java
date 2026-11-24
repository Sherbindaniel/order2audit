package com.orderaudit.production.repository;

import com.orderaudit.production.entity.ProductionMaterialIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionMaterialIssueRepository extends JpaRepository<ProductionMaterialIssue, Long> {
    List<ProductionMaterialIssue> findByProductionRunId(Long runId);
}

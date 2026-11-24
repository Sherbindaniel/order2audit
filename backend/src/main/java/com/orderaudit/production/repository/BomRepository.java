package com.orderaudit.production.repository;

import com.orderaudit.production.entity.Bom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BomRepository extends JpaRepository<Bom, Long> {
    Optional<Bom> findByProductIdAndActiveTrue(Long productId);
    Optional<Bom> findByProductIdAndVersion(Long productId, int version);
    List<Bom> findByActiveTrue();

    @Query("SELECT COALESCE(MAX(b.version), 0) FROM Bom b WHERE b.product.id = :productId")
    int findMaxVersionForProduct(@Param("productId") Long productId);
}

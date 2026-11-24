package com.orderaudit.inventory.repository;

import com.orderaudit.inventory.entity.UnitConversion;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UnitConversionRepository extends JpaRepository<UnitConversion, Long> {
    Optional<UnitConversion> findByFromUnitAndToUnit(UnitOfMeasure fromUnit, UnitOfMeasure toUnit);
}

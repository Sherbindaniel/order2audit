package com.orderaudit.inventory.service;

import com.orderaudit.common.exception.BusinessException;
import com.orderaudit.inventory.entity.UnitConversion;
import com.orderaudit.inventory.entity.UnitOfMeasure;
import com.orderaudit.inventory.repository.UnitConversionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class UnitConversionService {
    private final UnitConversionRepository unitConversionRepository;

    public BigDecimal convert(BigDecimal value, UnitOfMeasure fromUnit, UnitOfMeasure toUnit) {
        if (value == null) return BigDecimal.ZERO;
        if (fromUnit == toUnit) return value;

        UnitConversion conversion = unitConversionRepository.findByFromUnitAndToUnit(fromUnit, toUnit)
                .orElseThrow(() -> new BusinessException("Cannot convert from " + fromUnit + " to " + toUnit));

        return value.multiply(conversion.getConversionFactor()).setScale(4, RoundingMode.HALF_UP);
    }

    public boolean areCompatible(UnitOfMeasure a, UnitOfMeasure b) {
        if (a == b) return true;
        return unitConversionRepository.findByFromUnitAndToUnit(a, b).isPresent();
    }
}

package com.orderaudit.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.math.BigDecimal;

@Getter
@ResponseStatus(HttpStatus.CONFLICT)
public class InsufficientStockException extends BusinessException {
    private final String itemName;
    private final BigDecimal available;
    private final BigDecimal requested;

    public InsufficientStockException(String itemName, BigDecimal available, BigDecimal requested) {
        super(String.format("Insufficient stock for '%s'. Available: %s, Requested: %s", itemName, available, requested));
        this.itemName = itemName;
        this.available = available;
        this.requested = requested;
    }
}

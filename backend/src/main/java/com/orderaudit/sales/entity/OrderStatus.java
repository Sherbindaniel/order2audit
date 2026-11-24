package com.orderaudit.sales.entity;

public enum OrderStatus {
    DRAFT,
    SUBMITTED,
    APPROVED,
    REJECTED,
    INVOICED,
    PARTIALLY_DISPATCHED,
    DISPATCHED,
    CANCELLED;

    public static boolean isValidTransition(OrderStatus from, OrderStatus to) {
        if (from == to) return true;
        if (to == CANCELLED) return from != DISPATCHED;

        return switch (from) {
            case DRAFT -> to == SUBMITTED;
            case SUBMITTED -> to == APPROVED || to == REJECTED;
            case APPROVED -> to == INVOICED || to == REJECTED;
            case REJECTED -> to == DRAFT;
            case INVOICED -> to == DISPATCHED || to == PARTIALLY_DISPATCHED;
            case PARTIALLY_DISPATCHED -> to == DISPATCHED;
            case DISPATCHED, CANCELLED -> false;
        };
    }
}

package com.orderaudit.sales.repository;

import com.orderaudit.sales.entity.OrderStatus;
import com.orderaudit.sales.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findByOrderNumber(String orderNumber);
    List<SalesOrder> findBySalesmanIdOrderByOrderDateDesc(Long salesmanId);
    List<SalesOrder> findByCustomerIdOrderByOrderDateDesc(Long customerId);
    List<SalesOrder> findByStatusOrderByOrderDateDesc(OrderStatus status);
    List<SalesOrder> findByOrderDateBetweenOrderByOrderDateDesc(LocalDate from, LocalDate to);
    long countByOrderDate(LocalDate date);
    long countByStatus(OrderStatus status);
}

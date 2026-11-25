package com.orderaudit.sales.repository;

import com.orderaudit.sales.entity.Dispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, Long> {
    Optional<Dispatch> findByDispatchNumber(String dispatchNumber);
    Optional<Dispatch> findByInvoiceId(Long invoiceId);
    List<Dispatch> findByCustomerIdOrderByDispatchDateDesc(Long customerId);
    List<Dispatch> findByDispatchDateBetweenOrderByDispatchDateDesc(LocalDate from, LocalDate to);
    long countByDispatchDate(LocalDate date);
}

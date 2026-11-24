package com.orderaudit.invoice.repository;

import com.orderaudit.invoice.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findBySalesOrderId(Long salesOrderId);
    List<Invoice> findByCustomerIdOrderByInvoiceDateDesc(Long customerId);
    List<Invoice> findByInvoiceDateBetweenOrderByInvoiceDateDesc(LocalDate from, LocalDate to);
    List<Invoice> findByFinancialYear(String financialYear);
    List<Invoice> findByAmountDueGreaterThanOrderByInvoiceDateAsc(java.math.BigDecimal zero);
}

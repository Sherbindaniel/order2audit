package com.orderaudit.invoice.repository;

import com.orderaudit.invoice.entity.InvoiceSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceSequenceRepository extends JpaRepository<InvoiceSequence, Long> {
    Optional<InvoiceSequence> findByFinancialYear(String financialYear);
}

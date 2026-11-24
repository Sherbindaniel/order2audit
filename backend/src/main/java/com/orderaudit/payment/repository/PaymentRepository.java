package com.orderaudit.payment.repository;

import com.orderaudit.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentNumber(String paymentNumber);
    List<Payment> findByCustomerIdOrderByPaymentDateDesc(Long customerId);
    List<Payment> findByPaymentDateBetweenOrderByPaymentDateDesc(LocalDate from, LocalDate to);
    long countByPaymentDate(LocalDate date);
}

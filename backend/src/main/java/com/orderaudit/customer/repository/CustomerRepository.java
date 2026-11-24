package com.orderaudit.customer.repository;

import com.orderaudit.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByActiveTrue();
    List<Customer> findByAssignedSalesmanId(Long salesmanId);
    Optional<Customer> findByName(String name);
}

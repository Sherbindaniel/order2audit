package com.orderaudit.sales.repository;

import com.orderaudit.sales.entity.DispatchItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DispatchItemRepository extends JpaRepository<DispatchItem, Long> {
    List<DispatchItem> findByDispatchId(Long dispatchId);
}

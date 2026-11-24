package com.orderaudit.audit.repository;

import com.orderaudit.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByPerformedAtDesc(String entityType, Long entityId);
    List<AuditLog> findByPerformedAtBetweenOrderByPerformedAtDesc(LocalDateTime from, LocalDateTime to);
}

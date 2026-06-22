package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.SuperAdminAuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuperAdminAuditLogRepository extends JpaRepository<SuperAdminAuditLog, Long> {
    List<SuperAdminAuditLog> findTop200ByOrderByCreatedAtDesc();
}

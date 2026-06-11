package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.AuditLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByGymIdOrderByCreatedAtDesc(Long gymId);

    long countByGymId(Long gymId);

    @Query("""
            SELECT log FROM AuditLog log
            LEFT JOIN log.actorUser actor
            WHERE log.gym.id = :gymId
            AND (CAST(:from AS timestamp) IS NULL OR log.createdAt >= :from)
            AND (CAST(:to AS timestamp) IS NULL OR log.createdAt <= :to)
            AND (CAST(:action AS text) IS NULL OR :action = '' OR LOWER(log.action) LIKE LOWER(CONCAT('%', :action, '%')))
            AND (CAST(:actorEmail AS text) IS NULL OR :actorEmail = '' OR LOWER(actor.email) LIKE LOWER(CONCAT('%', :actorEmail, '%')))
            ORDER BY log.createdAt DESC
            """)
    List<AuditLog> searchByGym(
            @Param("gymId") Long gymId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("action") String action,
            @Param("actorEmail") String actorEmail
    );
}

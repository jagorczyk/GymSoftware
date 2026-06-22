package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.SuperAdminAuditLogDTO;
import com.jagorczyk.gymManagement.domain.SuperAdminAuditLog;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.SuperAdminAuditLogRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SuperAdminAuditService {
    private final SuperAdminAuditLogRepository auditLogRepository;

    public SuperAdminAuditService(SuperAdminAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(User actor, String action, String targetType, Long targetId, String details) {
        SuperAdminAuditLog entry = new SuperAdminAuditLog();
        entry.setActorUser(actor);
        entry.setAction(action);
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<SuperAdminAuditLogDTO> recentLogs() {
        return auditLogRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .map(log -> new SuperAdminAuditLogDTO(
                        log.getId(),
                        log.getActorUser().getEmail(),
                        log.getAction(),
                        log.getTargetType(),
                        log.getTargetId(),
                        log.getDetails(),
                        log.getCreatedAt()
                ))
                .toList();
    }
}

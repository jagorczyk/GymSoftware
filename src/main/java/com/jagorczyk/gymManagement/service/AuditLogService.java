package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.AuditLog;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Gym gym, User actor, String action, String payload) {
        AuditLog log = new AuditLog();
        log.setGym(gym);
        log.setActorUser(actor);
        log.setAction(action);
        log.setPayload(payload);
        auditLogRepository.save(log);
    }
}

package com.jagorczyk.gymManagement.api;

import java.time.LocalDateTime;

public record SuperAdminAuditLogDTO(
        Long id,
        String actorEmail,
        String action,
        String targetType,
        Long targetId,
        String details,
        LocalDateTime createdAt
) {}

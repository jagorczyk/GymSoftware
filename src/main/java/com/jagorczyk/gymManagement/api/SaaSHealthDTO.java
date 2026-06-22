package com.jagorczyk.gymManagement.api;

import java.util.List;

public record SaaSHealthDTO(
        boolean databaseOk,
        String databaseMessage,
        boolean smtpConfigured,
        String smtpMessage,
        boolean stripeConfigured,
        boolean stripeReachable,
        String stripeMessage,
        List<JobHealthDTO> scheduledJobs,
        WebhookHealthDTO stripeWebhook
) {
    public record JobHealthDTO(String jobName, String lastRunAt, String status, String message) {}
    public record WebhookHealthDTO(
            boolean secretConfigured,
            String endpointUrl,
            String lastReceivedAt,
            String lastEventType,
            String status,
            String message
    ) {}
}

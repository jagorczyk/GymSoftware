package com.jagorczyk.gymManagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GymScheduledJobs {
    private static final Logger log = LoggerFactory.getLogger(GymScheduledJobs.class);

    private final PassService passService;
    private final NotificationService notificationService;

    public GymScheduledJobs(PassService passService, NotificationService notificationService) {
        this.passService = passService;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "${app.jobs.expire-passes-cron:0 0 1 * * *}")
    public void expirePasses() {
        int count = passService.expirePassesPastEndDate();
        if (count > 0) {
            log.info("Automatycznie wygaszono {} karnetów.", count);
        }
    }

    @Scheduled(cron = "${app.jobs.expiring-notifications-cron:0 0 8 * * *}")
    public void expiringPassNotifications() {
        int count = notificationService.processExpiringPassNotifications();
        if (count > 0) {
            log.info("Utworzono {} powiadomień o wygasających karnetach.", count);
        }
    }
}

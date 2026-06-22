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
    private final ScheduledJobTracker scheduledJobTracker;

    public GymScheduledJobs(
            PassService passService,
            NotificationService notificationService,
            ScheduledJobTracker scheduledJobTracker
    ) {
        this.passService = passService;
        this.notificationService = notificationService;
        this.scheduledJobTracker = scheduledJobTracker;
    }

    @Scheduled(cron = "${app.jobs.expire-passes-cron:0 0 1 * * *}")
    public void expirePasses() {
        try {
            int count = passService.expirePassesPastEndDate();
            if (count > 0) {
                log.info("Automatycznie wygaszono {} karnetów.", count);
            }

            int unfreezeCount = passService.processPassFreezes();
            if (unfreezeCount > 0) {
                log.info("Automatycznie odwieszono {} zamrożonych karnetów.", unfreezeCount);
            }
            scheduledJobTracker.recordSuccess("expire_passes", "expired=" + count + ", unfrozen=" + unfreezeCount);
        } catch (Exception ex) {
            scheduledJobTracker.recordFailure("expire_passes", ex.getMessage());
            throw ex;
        }
    }

    @Scheduled(cron = "${app.jobs.expiring-notifications-cron:0 0 8 * * *}")
    public void expiringPassNotifications() {
        try {
            int count = notificationService.processExpiringPassNotifications();
            if (count > 0) {
                log.info("Utworzono {} powiadomień o wygasających karnetach.", count);
            }
            scheduledJobTracker.recordSuccess("expiring_pass_notifications", "created=" + count);
        } catch (Exception ex) {
            scheduledJobTracker.recordFailure("expiring_pass_notifications", ex.getMessage());
            throw ex;
        }
    }
}

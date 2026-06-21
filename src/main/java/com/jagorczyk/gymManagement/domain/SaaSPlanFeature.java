package com.jagorczyk.gymManagement.domain;

import java.util.Arrays;
import java.util.List;

public enum SaaSPlanFeature {
    SCHEDULE,
    WORK_SCHEDULE,
    TRAINER_BOOKINGS,
    LOCKERS,
    INVENTORY,
    ANALYTICS,
    CRM,
    CLASS_RATINGS,
    NOTIFICATIONS,
    SALES_REPORT,
    AUDIT_LOG;

    public static List<SaaSPlanFeature> all() {
        return Arrays.asList(values());
    }
}

package com.jagorczyk.gymManagement.api;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaaSAdminStatsDTO {
    private BigDecimal totalMrr;
    private long activeGyms;
    private long trialingGyms;
    private long canceledGyms;
    
    private List<PlanStat> subscriptionsByPlan;
    private List<StatusStat> subscriptionsByStatus;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PlanStat {
        private String planName;
        private long count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StatusStat {
        private String statusName;
        private long count;
    }
}

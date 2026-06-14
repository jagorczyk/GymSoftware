package com.jagorczyk.gymManagement.api.dto;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsDtos {

    public record DashboardMetrics(
            long activePasses,
            long activeGuests,
            long newGuestsThisMonth,
            long checkInsToday,
            BigDecimal revenueThisMonth,
            BigDecimal productRevenueThisMonth
    ) {}

    public record ChartDataPoint(
            String label,
            BigDecimal value
    ) {}

    public record PassTypePopularity(
            String passTypeName,
            long count
    ) {}

    public record AnalyticsDashboardDto(
            DashboardMetrics metrics,
            List<ChartDataPoint> revenueOverTime,
            List<ChartDataPoint> checkInsOverTime,
            List<PassTypePopularity> passTypePopularity
    ) {}
}

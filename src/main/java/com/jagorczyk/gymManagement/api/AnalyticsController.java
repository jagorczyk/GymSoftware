package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.AnalyticsDtos.AnalyticsDashboardDto;
import com.jagorczyk.gymManagement.service.AnalyticsService;
import com.jagorczyk.gymManagement.service.CurrentUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner/gyms/{gymId}/analytics")
@PreAuthorize("hasRole('OWNER')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final CurrentUserService currentUserService;

    public AnalyticsController(AnalyticsService analyticsService, CurrentUserService currentUserService) {
        this.analyticsService = analyticsService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public AnalyticsDashboardDto getDashboard(@PathVariable Long gymId) {
        return analyticsService.getDashboard(currentUserService.getCurrentUser().getId(), gymId);
    }
}

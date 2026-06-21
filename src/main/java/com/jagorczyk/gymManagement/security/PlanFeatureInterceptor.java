package com.jagorczyk.gymManagement.security;

import com.jagorczyk.gymManagement.domain.SaaSPlanFeature;
import com.jagorczyk.gymManagement.service.SaaSPlanFeatureService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class PlanFeatureInterceptor implements HandlerInterceptor {
    private static final Pattern GYM_URI = Pattern.compile("^/api/(?:owner|client|employee)/gyms/(\\d+)(/.*)?$");

    private final SaaSPlanFeatureService saasPlanFeatureService;

    public PlanFeatureInterceptor(SaaSPlanFeatureService saasPlanFeatureService) {
        this.saasPlanFeatureService = saasPlanFeatureService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        String uri = request.getRequestURI();
        Matcher matcher = GYM_URI.matcher(uri);
        if (!matcher.find()) {
            return true;
        }

        SaaSPlanFeature required = requiredFeature(uri, matcher.group(2));
        if (required == null) {
            return true;
        }

        Long gymId = Long.valueOf(matcher.group(1));
        if (!saasPlanFeatureService.gymHasFeature(gymId, required)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"error\":\"Funkcja niedostępna w Twoim planie subskrypcji. Ulepsz pakiet, aby uzyskać dostęp.\"}"
            );
            return false;
        }

        return true;
    }

    private SaaSPlanFeature requiredFeature(String uri, String suffix) {
        if (suffix == null || suffix.isEmpty() || suffix.equals("/")) {
            return null;
        }

        if (containsAny(suffix, "/calendar-events", "/classes")) {
            return SaaSPlanFeature.SCHEDULE;
        }
        if (suffix.contains("/work-schedule")) {
            return SaaSPlanFeature.WORK_SCHEDULE;
        }
        if (suffix.contains("/trainers")) {
            return SaaSPlanFeature.TRAINER_BOOKINGS;
        }
        if (suffix.contains("/lockers")) {
            return SaaSPlanFeature.LOCKERS;
        }
        if (containsAny(suffix, "/products", "/sales/products")) {
            return SaaSPlanFeature.INVENTORY;
        }
        if (suffix.contains("/analytics")) {
            return SaaSPlanFeature.ANALYTICS;
        }
        if (suffix.contains("/crm")) {
            return SaaSPlanFeature.CRM;
        }
        if (suffix.contains("/ratings")) {
            return SaaSPlanFeature.CLASS_RATINGS;
        }
        if (suffix.contains("/notifications") || suffix.contains("/notification-settings")) {
            return SaaSPlanFeature.NOTIFICATIONS;
        }
        if (suffix.contains("/sales-report")) {
            return SaaSPlanFeature.SALES_REPORT;
        }
        if (suffix.contains("/audit-logs")) {
            return SaaSPlanFeature.AUDIT_LOG;
        }

        return null;
    }

    private boolean containsAny(String value, String... needles) {
        for (String needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}

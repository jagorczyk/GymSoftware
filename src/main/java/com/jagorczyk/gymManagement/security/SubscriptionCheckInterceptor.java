package com.jagorczyk.gymManagement.security;

import com.jagorczyk.gymManagement.domain.GymSubscription;
import com.jagorczyk.gymManagement.domain.SubscriptionStatus;
import com.jagorczyk.gymManagement.repository.GymSubscriptionRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

@Component
public class SubscriptionCheckInterceptor implements HandlerInterceptor {

    private final GymSubscriptionRepository gymSubscriptionRepository;

    public SubscriptionCheckInterceptor(GymSubscriptionRepository gymSubscriptionRepository) {
        this.gymSubscriptionRepository = gymSubscriptionRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();

        // Zawsze przepuszczamy endpointy potrzebne do opłacenia i odzyskania subskrypcji oraz podstawowe detale do renderu UI
        if (uri.matches("^/api/(?:owner|client|employee)/gyms/\\d+/(?:subscription|checkout|details).*$")) {
            return true;
        }

        // Sprawdzamy czy żądanie dotyczy konkretnej siłowni (zawiera gymId jako zmienną ścieżki)
        @SuppressWarnings("unchecked")
        Map<String, String> pathVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        
        if (pathVariables != null && pathVariables.containsKey("gymId")) {
            try {
                Long gymId = Long.valueOf(pathVariables.get("gymId"));
                GymSubscription sub = gymSubscriptionRepository.findByGymId(gymId).orElse(null);

                if (sub != null && (sub.getStatus() == SubscriptionStatus.CANCELED ||
                        sub.getStatus() == SubscriptionStatus.PAST_DUE ||
                        sub.getStatus() == SubscriptionStatus.UNPAID)) {

                    response.setStatus(HttpStatus.PAYMENT_REQUIRED.value());
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\": \"Subskrypcja siłowni wygasła lub jest nieopłacona. Dostęp zablokowany.\"}");
                    return false;
                }
            } catch (NumberFormatException e) {
                // Ignore parsing errors, it just means gymId was not a valid number
            }
        }

        return true;
    }
}

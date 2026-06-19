package com.jagorczyk.gymManagement.security;

import com.jagorczyk.gymManagement.domain.GymSubscription;
import com.jagorczyk.gymManagement.domain.SubscriptionStatus;
import com.jagorczyk.gymManagement.repository.GymSubscriptionRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SubscriptionCheckInterceptor implements HandlerInterceptor {

    private final GymSubscriptionRepository gymSubscriptionRepository;

    public SubscriptionCheckInterceptor(GymSubscriptionRepository gymSubscriptionRepository) {
        this.gymSubscriptionRepository = gymSubscriptionRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        String uri = request.getRequestURI();

        // Zawsze przepuszczamy endpointy potrzebne do opłacenia i odzyskania subskrypcji oraz podstawowe detale do renderu UI
        if (uri.matches("^/api/(?:owner|client|employee)/gyms/\\d+/(?:subscription|checkout|details).*$")) {
            return true;
        }

        // Pobieranie gymId bezpośrednio z URI za pomocą wyrażenia regularnego
        Matcher matcher = Pattern.compile("^/api/(?:owner|client|employee)/gyms/(\\d+)").matcher(uri);
        
        if (matcher.find()) {
            try {
                Long gymId = Long.valueOf(matcher.group(1));
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
                // Ignore parsing errors
            }
        }

        return true;
    }
}

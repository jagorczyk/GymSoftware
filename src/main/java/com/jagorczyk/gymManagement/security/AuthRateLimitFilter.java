package com.jagorczyk.gymManagement.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private final int maxRequests;
    private final Duration window;
    private final ConcurrentHashMap<String, Window> buckets = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(
            @Value("${app.auth.rate-limit.max-requests:30}") int maxRequests,
            @Value("${app.auth.rate-limit.window-seconds:60}") long windowSeconds
    ) {
        this.maxRequests = maxRequests;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String key = clientKey(request);
        if (!allow(key)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Zbyt wiele żądań. Spróbuj ponownie za chwilę.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean allow(String key) {
        Instant now = Instant.now();
        Window windowState = buckets.compute(key, (ignored, current) -> {
            if (current == null || now.isAfter(current.resetAt())) {
                return new Window(1, now.plus(window));
            }
            current.increment();
            return current;
        });
        return windowState.count() <= maxRequests;
    }

    private static String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record Window(int count, Instant resetAt) {
        Window increment() {
            return new Window(count + 1, resetAt);
        }
    }
}

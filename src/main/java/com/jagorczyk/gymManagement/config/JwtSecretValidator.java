package com.jagorczyk.gymManagement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class JwtSecretValidator {
    private static final String INSECURE_DEFAULT = "your-very-long-secret-key-your-very-long-secret-key";

    private final String jwtSecret;
    private final boolean requireSecureSecret;

    public JwtSecretValidator(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.require-secure-secret:false}") boolean requireSecureSecret
    ) {
        this.jwtSecret = jwtSecret;
        this.requireSecureSecret = requireSecureSecret;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validateOnStartup() {
        if (!requireSecureSecret) {
            return;
        }
        if (jwtSecret == null || jwtSecret.isBlank() || INSECURE_DEFAULT.equals(jwtSecret)) {
            throw new IllegalStateException(
                    "JWT_SECRET musi być ustawiony na silną, unikalną wartość (app.jwt.require-secure-secret=true)."
            );
        }
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET musi mieć co najmniej 32 znaki.");
        }
    }
}

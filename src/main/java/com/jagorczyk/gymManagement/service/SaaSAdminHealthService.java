package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.SaaSHealthDTO;
import com.jagorczyk.gymManagement.config.StripeProperties;
import com.jagorczyk.gymManagement.domain.ScheduledJobRun;
import com.jagorczyk.gymManagement.repository.ScheduledJobRunRepository;
import com.stripe.Stripe;
import com.stripe.model.Balance;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SaaSAdminHealthService {
    private final DataSource dataSource;
    private final ScheduledJobRunRepository scheduledJobRunRepository;
    private final StripeProperties stripeProperties;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    public SaaSAdminHealthService(
            DataSource dataSource,
            ScheduledJobRunRepository scheduledJobRunRepository,
            StripeProperties stripeProperties
    ) {
        this.dataSource = dataSource;
        this.scheduledJobRunRepository = scheduledJobRunRepository;
        this.stripeProperties = stripeProperties;
    }

    @Transactional(readOnly = true)
    public SaaSHealthDTO getHealth() {
        boolean databaseOk = false;
        String databaseMessage = "Nieznany błąd";
        try (var connection = dataSource.getConnection()) {
            databaseOk = connection.isValid(2);
            databaseMessage = databaseOk ? "Połączenie z bazą danych działa" : "Baza danych nie odpowiada";
        } catch (Exception ex) {
            databaseMessage = ex.getMessage();
        }

        boolean smtpConfigured = smtpHost != null && !smtpHost.isBlank() && smtpUsername != null && !smtpUsername.isBlank();
        String smtpMessage = smtpConfigured
                ? "SMTP skonfigurowane (" + smtpHost + ")"
                : "Brak konfiguracji SMTP — e-maile działają w trybie mock";

        String stripeKey = stripeProperties.getApi().getKey();
        boolean stripeConfigured = stripeKey != null && !stripeKey.isBlank() && !stripeKey.contains("placeholder");
        boolean stripeReachable = false;
        String stripeMessage = "Stripe nie jest skonfigurowany";
        if (stripeConfigured) {
            try {
                Stripe.apiKey = stripeKey;
                Balance balance = Balance.retrieve();
                stripeReachable = balance != null;
                stripeMessage = stripeReachable ? "Połączenie ze Stripe działa" : "Stripe nie odpowiedział";
            } catch (Exception ex) {
                stripeMessage = "Błąd Stripe: " + ex.getMessage();
            }
        }

        List<SaaSHealthDTO.JobHealthDTO> jobs = scheduledJobRunRepository.findAll().stream()
                .map(this::toJobHealth)
                .toList();

        ScheduledJobRun webhookRun = scheduledJobRunRepository.findById("stripe_webhook").orElse(null);
        String webhookSecret = stripeProperties.getWebhook() != null ? stripeProperties.getWebhook().getSecret() : null;
        boolean webhookSecretConfigured = webhookSecret != null
                && !webhookSecret.isBlank()
                && !webhookSecret.contains("placeholder");
        String webhookEndpoint = buildWebhookEndpoint();
        SaaSHealthDTO.WebhookHealthDTO webhookHealth;
        if (!webhookSecretConfigured) {
            webhookHealth = new SaaSHealthDTO.WebhookHealthDTO(
                    false,
                    webhookEndpoint,
                    null,
                    null,
                    "NIE_SKONFIGUROWANY",
                    "Ustaw STRIPE_WEBHOOK_SECRET w środowisku i zarejestruj endpoint w Stripe Dashboard"
            );
        } else if (webhookRun == null || webhookRun.getLastRunAt() == null) {
            webhookHealth = new SaaSHealthDTO.WebhookHealthDTO(
                    true,
                    webhookEndpoint,
                    null,
                    null,
                    "GOTOWY",
                    "Endpoint skonfigurowany — brak eventów od Stripe (wykonaj testową płatność lub wyślij test webhook)"
            );
        } else {
            boolean lastOk = "SUCCESS".equals(webhookRun.getLastStatus());
            webhookHealth = new SaaSHealthDTO.WebhookHealthDTO(
                    true,
                    webhookEndpoint,
                    webhookRun.getLastRunAt().toString(),
                    webhookRun.getLastMessage(),
                    webhookRun.getLastStatus(),
                    lastOk
                            ? "Ostatni webhook odebrany poprawnie"
                            : "Ostatni webhook zakończył się błędem: " + webhookRun.getLastMessage()
            );
        }

        return new SaaSHealthDTO(
                databaseOk,
                databaseMessage,
                smtpConfigured,
                smtpMessage,
                stripeConfigured,
                stripeReachable,
                stripeMessage,
                jobs,
                webhookHealth
        );
    }

    private SaaSHealthDTO.JobHealthDTO toJobHealth(ScheduledJobRun run) {
        return new SaaSHealthDTO.JobHealthDTO(
                run.getJobName(),
                run.getLastRunAt() != null ? run.getLastRunAt().toString() : null,
                run.getLastStatus(),
                run.getLastMessage()
        );
    }

    private String buildWebhookEndpoint() {
        try {
            java.net.URI uri = java.net.URI.create(frontendUrl.trim());
            String origin = uri.getScheme() + "://" + uri.getAuthority();
            return origin + "/api/stripe/webhook";
        } catch (Exception ex) {
            return "/api/stripe/webhook";
        }
    }
}

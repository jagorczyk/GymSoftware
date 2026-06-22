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
        SaaSHealthDTO.WebhookHealthDTO webhookHealth = webhookRun == null
                ? new SaaSHealthDTO.WebhookHealthDTO(null, null, "BRAK_DANYCH")
                : new SaaSHealthDTO.WebhookHealthDTO(
                        webhookRun.getLastRunAt() != null ? webhookRun.getLastRunAt().toString() : null,
                        webhookRun.getLastMessage(),
                        webhookRun.getLastStatus()
                );

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
}

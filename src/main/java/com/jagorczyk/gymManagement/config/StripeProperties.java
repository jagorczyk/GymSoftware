package com.jagorczyk.gymManagement.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "stripe")
@Getter
@Setter
public class StripeProperties {
    private Api api;
    private Webhook webhook;
    private Success success;
    private Cancel cancel;
    private Connect connect = new Connect();

    @Getter
    @Setter
    public static class Api {
        private String key;
    }

    @Getter
    @Setter
    public static class Webhook {
        private String secret;
    }

    @Getter
    @Setter
    public static class Success {
        private String url;
    }

    @Getter
    @Setter
    public static class Cancel {
        private String url;
    }

    @Getter
    @Setter
    public static class Connect {
        /** Platform fee taken from each client payment (percent of gross). */
        private int applicationFeePercent = 5;
        private String country = "PL";
    }
}

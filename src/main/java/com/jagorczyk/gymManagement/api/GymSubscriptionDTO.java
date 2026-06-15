package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.domain.SubscriptionStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GymSubscriptionDTO {
    private Long id;
    private Long gymId;
    private String gymName;
    private String gymAddress;
    private String ownerEmail;
    private String ownerFirstName;
    private String ownerLastName;
    private Long saasPlanId;
    private String saasPlanName;
    private SubscriptionStatus status;
    private String stripeSubscriptionId;
    private LocalDateTime currentPeriodEnd;
    private LocalDateTime createdAt;
}

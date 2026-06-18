package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.GymSubscription;
import com.jagorczyk.gymManagement.domain.SubscriptionStatus;
import com.jagorczyk.gymManagement.repository.GymSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class SaaSSubscriptionService {

    private final GymSubscriptionRepository gymSubscriptionRepository;

    @Transactional
    public void activateSubscription(Long gymId, String subscriptionId, String customerId) {
        GymSubscription subscription = gymSubscriptionRepository.findByGymId(gymId)
                .orElseThrow(() -> new IllegalArgumentException("Gym subscription not found"));

        subscription.setStripeSubscriptionId(subscriptionId);
        subscription.setStripeCustomerId(customerId);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        
        try {
            com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(subscriptionId);
            if (stripeSub.getCurrentPeriodEnd() != null) {
                subscription.setCurrentPeriodEnd(LocalDateTime.ofInstant(Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd()), ZoneId.systemDefault()));
            }
        } catch (Exception e) {
            System.err.println("Could not retrieve subscription details from Stripe to sync period end: " + e.getMessage());
        }
        
        gymSubscriptionRepository.save(subscription);
    }

    @Transactional
    public void updateSubscriptionStatus(String subscriptionId, String statusStr, Long currentPeriodEndTimestamp) {
        gymSubscriptionRepository.findByStripeSubscriptionId(subscriptionId).ifPresent(sub -> {
            switch (statusStr) {
                case "active":
                    sub.setStatus(SubscriptionStatus.ACTIVE);
                    break;
                case "past_due":
                    sub.setStatus(SubscriptionStatus.PAST_DUE);
                    break;
                case "canceled":
                case "unpaid":
                    sub.setStatus(SubscriptionStatus.CANCELED);
                    break;
            }
            if (currentPeriodEndTimestamp != null) {
                sub.setCurrentPeriodEnd(LocalDateTime.ofInstant(Instant.ofEpochSecond(currentPeriodEndTimestamp), ZoneId.systemDefault()));
            }
            gymSubscriptionRepository.save(sub);
        });
    }
}

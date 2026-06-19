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
    public void handleSubscriptionWebhook(com.stripe.model.Subscription subscription) {
        GymSubscription sub = gymSubscriptionRepository.findByStripeSubscriptionId(subscription.getId())
                .orElseGet(() -> gymSubscriptionRepository.findByStripeCustomerId(subscription.getCustomer()).orElse(null));

        if (sub != null) {
            // Jeśli webhook dotyczy nowej subskrypcji na tym samym koncie klienta
            if (sub.getStripeSubscriptionId() != null && !sub.getStripeSubscriptionId().equals(subscription.getId())) {
                // Akceptujemy nową subskrypcję tylko jeśli jest aktywna/trialowa
                if ("active".equals(subscription.getStatus()) || "trialing".equals(subscription.getStatus())) {
                    sub.setStripeSubscriptionId(subscription.getId());
                } else {
                    // Jeśli webhook dotyczy innej, anulowanej subskrypcji, a my już śledzimy inną (np. aktywną) - ignorujemy
                    return;
                }
            }

            switch (subscription.getStatus()) {
                case "active":
                case "trialing":
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

            if (subscription.getCurrentPeriodEnd() != null) {
                sub.setCurrentPeriodEnd(LocalDateTime.ofInstant(Instant.ofEpochSecond(subscription.getCurrentPeriodEnd()), ZoneId.systemDefault()));
            }

            gymSubscriptionRepository.save(sub);
        }
    }
}

package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.GymSubscriptionDTO;
import com.jagorczyk.gymManagement.domain.GymSubscription;
import com.jagorczyk.gymManagement.repository.GymSubscriptionRepository;
import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.jagorczyk.gymManagement.api.SaaSAdminStatsDTO;

@Service
@RequiredArgsConstructor
public class SaaSAdminService {

    private final GymSubscriptionRepository gymSubscriptionRepository;
    private final StripeService stripeService;

    @Transactional(readOnly = true)
    public List<GymSubscriptionDTO> getAllSubscriptions() {
        return gymSubscriptionRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SaaSAdminStatsDTO getSaaSStats() {
        List<GymSubscription> all = gymSubscriptionRepository.findAll();
        
        long active = 0;
        long trialing = 0;
        long canceled = 0;
        BigDecimal mrr = BigDecimal.ZERO;

        java.util.Map<String, Long> planCounts = new java.util.HashMap<>();
        java.util.Map<String, Long> statusCounts = new java.util.HashMap<>();

        for (GymSubscription sub : all) {
            String status = sub.getStatus().name();
            statusCounts.put(status, statusCounts.getOrDefault(status, 0L) + 1);

            if (sub.getStatus() == com.jagorczyk.gymManagement.domain.SubscriptionStatus.ACTIVE) {
                active++;
                if (sub.getSaasPlan() != null && sub.getSaasPlan().getPrice() != null) {
                    mrr = mrr.add(sub.getSaasPlan().getPrice());
                }
            } else if (sub.getStatus() == com.jagorczyk.gymManagement.domain.SubscriptionStatus.TRIAL) {
                trialing++;
            } else if (sub.getStatus() == com.jagorczyk.gymManagement.domain.SubscriptionStatus.CANCELED) {
                canceled++;
            }

            if (sub.getSaasPlan() != null) {
                String planName = sub.getSaasPlan().getName();
                planCounts.put(planName, planCounts.getOrDefault(planName, 0L) + 1);
            }
        }

        List<SaaSAdminStatsDTO.PlanStat> planStats = planCounts.entrySet().stream()
            .map(e -> new SaaSAdminStatsDTO.PlanStat(e.getKey(), e.getValue()))
            .collect(Collectors.toList());

        List<SaaSAdminStatsDTO.StatusStat> statusStats = statusCounts.entrySet().stream()
            .map(e -> new SaaSAdminStatsDTO.StatusStat(e.getKey(), e.getValue()))
            .collect(Collectors.toList());

        return SaaSAdminStatsDTO.builder()
            .totalMrr(mrr)
            .activeGyms(active)
            .trialingGyms(trialing)
            .canceledGyms(canceled)
            .subscriptionsByPlan(planStats)
            .subscriptionsByStatus(statusStats)
            .build();
    }

    private GymSubscriptionDTO mapToDTO(GymSubscription sub) {
        GymSubscriptionDTO dto = new GymSubscriptionDTO();
        dto.setId(sub.getId());
        dto.setGymId(sub.getGym().getId());
        dto.setGymName(sub.getGym().getName());
        dto.setGymAddress(sub.getGym().getAddress());
        if (sub.getGym().getOwnerUser() != null) {
            dto.setOwnerEmail(sub.getGym().getOwnerUser().getEmail());
            dto.setOwnerFirstName(sub.getGym().getOwnerUser().getFirstName());
            dto.setOwnerLastName(sub.getGym().getOwnerUser().getLastName());
        }
        dto.setSaasPlanId(sub.getSaasPlan().getId());
        dto.setSaasPlanName(sub.getSaasPlan().getName());
        dto.setStatus(sub.getStatus());
        dto.setStripeSubscriptionId(sub.getStripeSubscriptionId());
        dto.setCurrentPeriodEnd(sub.getCurrentPeriodEnd());
        dto.setCreatedAt(sub.getCreatedAt());
        return dto;
    }

    @Transactional
    public void cancelSubscription(Long subscriptionId) {
        GymSubscription sub = gymSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        if (sub.getStripeSubscriptionId() != null && !sub.getStripeSubscriptionId().isEmpty()) {
            try {
                stripeService.cancelSubscription(sub.getStripeSubscriptionId());
            } catch (Exception e) {
                throw new RuntimeException("Failed to cancel subscription in Stripe: " + e.getMessage(), e);
            }
        }
        sub.setStatus(com.jagorczyk.gymManagement.domain.SubscriptionStatus.CANCELED);
        gymSubscriptionRepository.save(sub);
    }

    @Transactional
    public void updateSubscriptionStatus(Long subscriptionId, com.jagorczyk.gymManagement.domain.SubscriptionStatus newStatus) {
        GymSubscription sub = gymSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        sub.setStatus(newStatus);
        gymSubscriptionRepository.save(sub);
    }
}

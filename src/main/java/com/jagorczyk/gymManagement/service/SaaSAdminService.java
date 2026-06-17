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
import com.jagorczyk.gymManagement.api.SaaSAdminUserDTO;
import com.jagorczyk.gymManagement.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;

@Service
@RequiredArgsConstructor
public class SaaSAdminService {

    private final GymSubscriptionRepository gymSubscriptionRepository;
    private final StripeService stripeService;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

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

    @Transactional(readOnly = true)
    public List<SaaSAdminUserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> SaaSAdminUserDTO.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole() != null ? user.getRole().name() : null)
                        .emailVerified(user.isEmailVerified())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUserCompletely(Long userId) {
        // Skrypt wykonujący chirurgiczne usunięcie powiązanych danych
        String sql = """
            DO $$ 
            DECLARE
                v_user_id bigint := ?;
            BEGIN
                IF EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
                    -- 1. Zależne od pracowników
                    DELETE FROM employee_permissions WHERE employee_id IN (SELECT id FROM employees WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id));
                    DELETE FROM employee_work_schedule_entries WHERE employee_id IN (SELECT id FROM employees WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id));
                    
                    -- 2. Zależne od szafek
                    DELETE FROM locker_assignments WHERE locker_id IN (SELECT id FROM lockers WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id));
                    
                    -- 3. Zależne od sprzedaży
                    DELETE FROM product_sale_items WHERE product_sale_id IN (SELECT id FROM product_sales WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id));
                    
                    -- 4. Zależne od zajęć i karnetów
                    DELETE FROM class_reservations WHERE group_class_id IN (SELECT id FROM group_classes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id));
                    DELETE FROM class_ratings WHERE group_class_id IN (SELECT id FROM group_classes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id));
                    DELETE FROM pass_freezes WHERE pass_id IN (SELECT id FROM passes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id));

                    -- 5. Encje powiązane z siłownią
                    DELETE FROM audit_logs WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM calendar_events WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM email_campaigns WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM employees WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM employee_ranks WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM group_classes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM guest_check_ins WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM guests WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM gym_notifications WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM gym_notification_settings WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM passes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM gym_subscriptions WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM lockers WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM pass_types WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM personal_trainer_profiles WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM personal_trainings WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM product_sales WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM products WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);
                    DELETE FROM trainer_availabilities WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = v_user_id);

                    -- 6. Inne logi przypisane do użytkownika
                    DELETE FROM audit_logs WHERE actor_user_id = v_user_id;
                    
                    -- 7. Usunięcie główne
                    DELETE FROM gyms WHERE owner_user_id = v_user_id;
                    DELETE FROM users WHERE id = v_user_id;
                END IF;
            END $$;
        """;
        jdbcTemplate.execute(sql.replace("?", String.valueOf(userId)));
    }
}

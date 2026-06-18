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
        // Sprawdź czy użytkownik istnieje
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("Użytkownik o ID " + userId + " nie istnieje");
        }

        // 1. Wyzeruj nullable FK referencje do użytkownika
        jdbcTemplate.update("UPDATE passes SET sold_by_user_id = NULL WHERE sold_by_user_id = ?", userId);
        jdbcTemplate.update("UPDATE guests SET user_id = NULL WHERE user_id = ?", userId);

        // 1b. Usuń rekordy z NOT NULL FK do użytkownika (nie można ustawić NULL)
        jdbcTemplate.update("DELETE FROM guest_check_ins WHERE checked_in_by_user_id = ?", userId);
        jdbcTemplate.update("UPDATE guest_check_ins SET checked_out_by_user_id = NULL WHERE checked_out_by_user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM locker_assignments WHERE assigned_by_user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM product_sale_items WHERE product_sale_id IN (SELECT id FROM product_sales WHERE sold_by_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM product_sales WHERE sold_by_user_id = ?", userId);

        // 2. Usuń calendar_events i employee_work_schedule_entries utworzone przez tego użytkownika
        jdbcTemplate.update("DELETE FROM calendar_events WHERE created_by_user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM employee_work_schedule_entries WHERE created_by_user_id = ?", userId);

        // 3. Usuń pracownika powiązanego bezpośrednio z tym użytkownikiem (jeśli jest EMPLOYEE)
        jdbcTemplate.update("DELETE FROM employee_permissions WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM employee_work_schedule_entries WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ?)", userId);
        // Wyzeruj instructor_id w group_classes przed usunięciem pracownika
        jdbcTemplate.update("DELETE FROM class_reservations WHERE group_class_id IN (SELECT id FROM group_classes WHERE instructor_id IN (SELECT id FROM employees WHERE user_id = ?))", userId);
        jdbcTemplate.update("DELETE FROM class_ratings WHERE group_class_id IN (SELECT id FROM group_classes WHERE instructor_id IN (SELECT id FROM employees WHERE user_id = ?))", userId);
        jdbcTemplate.update("DELETE FROM group_classes WHERE instructor_id IN (SELECT id FROM employees WHERE user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM personal_trainings WHERE trainer_id IN (SELECT id FROM employees WHERE user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM personal_trainer_profiles WHERE employee_id IN (SELECT id FROM employees WHERE user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM employees WHERE user_id = ?", userId);

        // 4. Dane siłowni, których ten użytkownik jest właścicielem (OWNER)
        // 4a. Zależne od pracowników siłowni
        jdbcTemplate.update("DELETE FROM employee_permissions WHERE employee_id IN (SELECT id FROM employees WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?))", userId);
        jdbcTemplate.update("DELETE FROM employee_work_schedule_entries WHERE employee_id IN (SELECT id FROM employees WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?))", userId);

        // 4b. Zależne od szafek
        jdbcTemplate.update("DELETE FROM locker_assignments WHERE locker_id IN (SELECT id FROM lockers WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?))", userId);

        // 4c. Zależne od sprzedaży
        jdbcTemplate.update("DELETE FROM product_sale_items WHERE product_sale_id IN (SELECT id FROM product_sales WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?))", userId);

        // 4d. Zależne od zajęć i karnetów
        jdbcTemplate.update("DELETE FROM class_reservations WHERE group_class_id IN (SELECT id FROM group_classes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?))", userId);
        jdbcTemplate.update("DELETE FROM class_ratings WHERE group_class_id IN (SELECT id FROM group_classes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?))", userId);
        jdbcTemplate.update("DELETE FROM pass_freezes WHERE pass_id IN (SELECT id FROM passes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?))", userId);

        // 4e. Zależne od gości (guest_check_ins przed guests)
        jdbcTemplate.update("DELETE FROM guest_check_ins WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);

        // 4f. Encje powiązane z siłownią
        jdbcTemplate.update("DELETE FROM audit_logs WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM calendar_events WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM email_campaigns WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM personal_trainings WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM personal_trainer_profiles WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM group_classes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM employees WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM employee_ranks WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM gym_notifications WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM gym_notification_settings WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM passes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM guests WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM gym_subscriptions WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM lockers WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM pass_types WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM product_sales WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM products WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?)", userId);

        // 5. Audit logi przypisane do użytkownika
        jdbcTemplate.update("DELETE FROM audit_logs WHERE actor_user_id = ?", userId);

        // 6. Usunięcie siłowni i użytkownika
        jdbcTemplate.update("DELETE FROM gyms WHERE owner_user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId);
    }
}

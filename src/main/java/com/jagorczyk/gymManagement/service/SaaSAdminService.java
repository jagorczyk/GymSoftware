package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.GymSubscriptionDTO;
import com.jagorczyk.gymManagement.api.ImpersonationResponse;
import com.jagorczyk.gymManagement.api.SaaSAdminStatsDTO;
import com.jagorczyk.gymManagement.api.SaaSAdminUserDTO;
import com.jagorczyk.gymManagement.domain.GymSubscription;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.SaaSPlan;
import com.jagorczyk.gymManagement.domain.SubscriptionStatus;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GymSubscriptionRepository;
import com.jagorczyk.gymManagement.repository.SaaSPlanRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import com.jagorczyk.gymManagement.security.JwtService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SaaSAdminService {

    private final GymSubscriptionRepository gymSubscriptionRepository;
    private final StripeService stripeService;
    private final UserRepository userRepository;
    private final SaaSPlanRepository saasPlanRepository;
    private final JdbcTemplate jdbcTemplate;
    private final CurrentUserService currentUserService;
    private final SuperAdminAuditService superAdminAuditService;
    private final JwtService jwtService;
    private final EmailService emailService;

    public SaaSAdminService(
            GymSubscriptionRepository gymSubscriptionRepository,
            StripeService stripeService,
            UserRepository userRepository,
            SaaSPlanRepository saasPlanRepository,
            JdbcTemplate jdbcTemplate,
            CurrentUserService currentUserService,
            SuperAdminAuditService superAdminAuditService,
            JwtService jwtService,
            EmailService emailService
    ) {
        this.gymSubscriptionRepository = gymSubscriptionRepository;
        this.stripeService = stripeService;
        this.userRepository = userRepository;
        this.saasPlanRepository = saasPlanRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.currentUserService = currentUserService;
        this.superAdminAuditService = superAdminAuditService;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    private User actor() {
        return currentUserService.getCurrentUser();
    }

    private void audit(String action, String targetType, Long targetId, String details) {
        superAdminAuditService.log(actor(), action, targetType, targetId, details);
    }

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
        dto.setAdminNotes(sub.getAdminNotes());
        dto.setFeatureFlagOverrides(SaaSPlanFeatureFlags.parseOverrides(sub.getFeatureFlagOverridesJson()));
        dto.setEffectiveFeatureFlags(SaaSPlanFeatureFlags.resolveEffectiveNames(
                sub.getSaasPlan().getFeatureFlagsJson(),
                sub.getFeatureFlagOverridesJson()));
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
        sub.setStatus(SubscriptionStatus.CANCELED);
        gymSubscriptionRepository.save(sub);
        audit("SUBSCRIPTION_CANCELED", "SUBSCRIPTION", subscriptionId, "gymId=" + sub.getGym().getId());
    }

    @Transactional
    public GymSubscriptionDTO extendSubscription(Long subscriptionId, int days, boolean reactivate) {
        if (days < 1 || days > 365) {
            throw new IllegalArgumentException("Liczba dni musi być od 1 do 365.");
        }

        GymSubscription sub = gymSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono subskrypcji."));

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime base = sub.getCurrentPeriodEnd();
        if (base == null || base.isBefore(now)) {
            base = now;
            sub.setCurrentPeriodStart(now);
        }
        sub.setCurrentPeriodEnd(base.plusDays(days));

        if (reactivate) {
            sub.setStatus(SubscriptionStatus.ACTIVE);
        } else if (sub.getStatus() == SubscriptionStatus.UNPAID
                || sub.getStatus() == SubscriptionStatus.CANCELED) {
            sub.setStatus(SubscriptionStatus.TRIAL);
        }

        gymSubscriptionRepository.save(sub);
        audit("SUBSCRIPTION_EXTENDED", "SUBSCRIPTION", subscriptionId,
                "days=" + days + ",reactivate=" + reactivate + ",newEnd=" + sub.getCurrentPeriodEnd());
        return mapToDTO(sub);
    }

    @Transactional
    public void changeSubscriptionPlan(Long subscriptionId, Long saasPlanId) {
        GymSubscription sub = gymSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        SaaSPlan plan = saasPlanRepository.findById(saasPlanId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        sub.setSaasPlan(plan);
        gymSubscriptionRepository.save(sub);
        audit("SUBSCRIPTION_PLAN_CHANGED", "SUBSCRIPTION", subscriptionId, "planId=" + saasPlanId);
    }

    @Transactional
    public GymSubscriptionDTO updateSubscriptionNotes(Long subscriptionId, String adminNotes) {
        GymSubscription sub = gymSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono subskrypcji."));
        sub.setAdminNotes(adminNotes);
        gymSubscriptionRepository.save(sub);
        audit("SUBSCRIPTION_NOTES_UPDATED", "SUBSCRIPTION", subscriptionId, truncate(adminNotes, 500));
        return mapToDTO(sub);
    }

    @Transactional
    public GymSubscriptionDTO updateFeatureOverrides(Long subscriptionId, Map<String, Boolean> overrides) {
        GymSubscription sub = gymSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono subskrypcji."));
        Map<String, Boolean> normalized = new LinkedHashMap<>();
        if (overrides != null) {
            for (Map.Entry<String, Boolean> entry : overrides.entrySet()) {
                normalized.put(entry.getKey(), Boolean.TRUE.equals(entry.getValue()));
            }
        }
        sub.setFeatureFlagOverridesJson(SaaSPlanFeatureFlags.serializeOverrides(normalized));
        gymSubscriptionRepository.save(sub);
        audit("SUBSCRIPTION_FEATURES_OVERRIDDEN", "SUBSCRIPTION", subscriptionId, normalized.toString());
        return mapToDTO(sub);
    }

    @Transactional
    public void updateSubscriptionStatus(Long subscriptionId, com.jagorczyk.gymManagement.domain.SubscriptionStatus newStatus) {
        GymSubscription sub = gymSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        sub.setStatus(newStatus);
        gymSubscriptionRepository.save(sub);
        audit("SUBSCRIPTION_STATUS_CHANGED", "SUBSCRIPTION", subscriptionId, "status=" + newStatus.name());
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
    public ImpersonationResponse impersonateUser(Long targetUserId) {
        User actor = actor();
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika."));
        if (target.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Nie można podszywać się pod super admina.");
        }
        if (target.getRole() != Role.OWNER && target.getRole() != Role.EMPLOYEE && target.getRole() != Role.GUEST) {
            throw new IllegalArgumentException("Nieobsługiwana rola do impersonacji.");
        }
        String token = jwtService.generateImpersonationToken(target, actor.getId());
        audit("USER_IMPERSONATED", "USER", targetUserId, "role=" + target.getRole().name());
        return new ImpersonationResponse(
                token,
                target.getRole().name(),
                target.getEmail(),
                actor.getId(),
                actor.getEmail()
        );
    }

    @Transactional
    public void resendUserVerification(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika."));
        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("E-mail użytkownika jest już zweryfikowany.");
        }
        if (user.getGoogleId() != null && !user.getGoogleId().isBlank()) {
            throw new IllegalArgumentException("Konto Google nie wymaga weryfikacji e-mail.");
        }
        String newCode = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setVerificationCode(newCode);
        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), newCode);
        audit("VERIFICATION_EMAIL_RESENT", "USER", userId, user.getEmail());
    }

    @Transactional(readOnly = true)
    public String exportSubscriptionsCsv() {
        StringBuilder csv = new StringBuilder();
        csv.append("id,gymId,gymName,ownerEmail,plan,status,periodEnd,adminNotes\n");
        for (GymSubscriptionDTO sub : getAllSubscriptions()) {
            csv.append(sub.getId()).append(',')
                    .append(sub.getGymId()).append(',')
                    .append(csv(sub.getGymName())).append(',')
                    .append(csv(sub.getOwnerEmail())).append(',')
                    .append(csv(sub.getSaasPlanName())).append(',')
                    .append(sub.getStatus()).append(',')
                    .append(csv(sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd().toString() : "")).append(',')
                    .append(csv(sub.getAdminNotes()))
                    .append('\n');
        }
        audit("SUBSCRIPTIONS_EXPORTED", "SYSTEM", null, "rows=" + getAllSubscriptions().size());
        return csv.toString();
    }

    @Transactional(readOnly = true)
    public String exportUsersCsv() {
        StringBuilder csv = new StringBuilder();
        csv.append("id,email,firstName,lastName,role,emailVerified\n");
        for (SaaSAdminUserDTO user : getAllUsers()) {
            csv.append(user.getId()).append(',')
                    .append(csv(user.getEmail())).append(',')
                    .append(csv(user.getFirstName())).append(',')
                    .append(csv(user.getLastName())).append(',')
                    .append(csv(user.getRole())).append(',')
                    .append(user.isEmailVerified())
                    .append('\n');
        }
        audit("USERS_EXPORTED", "SYSTEM", null, "rows=" + getAllUsers().size());
        return csv.toString();
    }

    private static String csv(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    @Transactional
    public void deleteUserCompletely(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Użytkownik o ID " + userId + " nie istnieje"));
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Nie można usunąć konta super admina");
        }
        audit("USER_DELETE_STARTED", "USER", userId, user.getEmail());
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
        jdbcTemplate.update("DELETE FROM pass_freezes WHERE gym_pass_id IN (SELECT id FROM passes WHERE gym_id IN (SELECT id FROM gyms WHERE owner_user_id = ?))", userId);

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
        audit("USER_DELETED", "USER", userId, "completed");
    }

    @Transactional
    public void resetAllDataExceptSuperAdmin(String confirmation) {
        if (!"WYCZYSC".equals(confirmation)) {
            throw new IllegalArgumentException("Nieprawidłowe potwierdzenie operacji");
        }
        audit("PLATFORM_RESET", "SYSTEM", null, confirmation);
        jdbcTemplate.execute("""
            TRUNCATE TABLE
              product_sale_items,
              product_sales,
              products,
              class_reservations,
              class_ratings,
              pass_freezes,
              guest_check_ins,
              locker_assignments,
              employee_permissions,
              employee_rank_permissions,
              employee_work_schedule_entries,
              personal_trainings,
              personal_trainer_profiles,
              trainer_availabilities,
              group_classes,
              calendar_events,
              email_campaigns,
              gym_notifications,
              gym_notification_settings,
              audit_logs,
              passes,
              pass_types,
              guests,
              lockers,
              employees,
              employee_ranks,
              gym_subscriptions,
              gyms
            RESTART IDENTITY CASCADE
            """);

        jdbcTemplate.update("DELETE FROM users WHERE role != ?", Role.SUPER_ADMIN.name());
    }
}

package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.CreateSaaSPlanRequest;
import com.jagorczyk.gymManagement.domain.SaaSPlan;
import com.jagorczyk.gymManagement.service.SaaSPlanService;
import com.jagorczyk.gymManagement.service.SaaSAdminService;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/saas")
@RequiredArgsConstructor
public class SaaSAdminController {

    private final SaaSPlanService saasPlanService;
    private final SaaSAdminService saasAdminService;

    @GetMapping("/subscriptions")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<GymSubscriptionDTO>> getAllSubscriptions() {
        return ResponseEntity.ok(saasAdminService.getAllSubscriptions());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SaaSAdminStatsDTO> getSaaSStats() {
        return ResponseEntity.ok(saasAdminService.getSaaSStats());
    }

    @GetMapping("/plans")
    public ResponseEntity<List<SaaSPlan>> getAllPlans() {
        return ResponseEntity.ok(saasPlanService.getAllPlans());
    }

    @PostMapping("/plans")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SaaSPlan> createPlan(@Valid @RequestBody CreateSaaSPlanRequest request) {
        return ResponseEntity.ok(saasPlanService.createPlan(request));
    }

    @GetMapping("/plans/{id}")
    public ResponseEntity<SaaSPlan> getPlan(@PathVariable Long id) {
        return ResponseEntity.ok(saasPlanService.getPlanById(id));
    }

    @DeleteMapping("/plans/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        saasPlanService.deletePlan(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/subscriptions/{id}/cancel")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> cancelSubscription(@PathVariable Long id) {
        saasAdminService.cancelSubscription(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/subscriptions/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> updateSubscriptionStatus(
            @PathVariable Long id, 
            @RequestBody java.util.Map<String, String> body) {
        String statusStr = body.get("status");
        com.jagorczyk.gymManagement.domain.SubscriptionStatus status = com.jagorczyk.gymManagement.domain.SubscriptionStatus.valueOf(statusStr);
        saasAdminService.updateSubscriptionStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/subscriptions/{id}/plan")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> changeSubscriptionPlan(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Long> body) {
        Long saasPlanId = body.get("saasPlanId");
        if (saasPlanId == null) {
            throw new IllegalArgumentException("saasPlanId is required");
        }
        saasAdminService.changeSubscriptionPlan(id, saasPlanId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/system/reset")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> resetAllData(@RequestBody java.util.Map<String, String> body) {
        String confirmation = body.get("confirmation");
        saasAdminService.resetAllDataExceptSuperAdmin(confirmation);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SaaSAdminUserDTO>> getAllUsers() {
        return ResponseEntity.ok(saasAdminService.getAllUsers());
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        saasAdminService.deleteUserCompletely(id);
        return ResponseEntity.ok().build();
    }
}

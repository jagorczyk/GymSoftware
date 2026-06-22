package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.SuperAdminSubscriptionRequests.UpdateFeatureOverridesRequest;
import com.jagorczyk.gymManagement.api.SuperAdminSubscriptionRequests.UpdateSubscriptionNotesRequest;
import com.jagorczyk.gymManagement.domain.SaaSPlan;
import com.jagorczyk.gymManagement.service.SaaSAdminHealthService;
import com.jagorczyk.gymManagement.service.SaaSAdminService;
import com.jagorczyk.gymManagement.service.SaaSPlanService;
import com.jagorczyk.gymManagement.service.SuperAdminAuditService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/saas")
public class SaaSAdminController {

    private final SaaSPlanService saasPlanService;
    private final SaaSAdminService saasAdminService;
    private final SuperAdminAuditService superAdminAuditService;
    private final SaaSAdminHealthService saasAdminHealthService;

    public SaaSAdminController(
            SaaSPlanService saasPlanService,
            SaaSAdminService saasAdminService,
            SuperAdminAuditService superAdminAuditService,
            SaaSAdminHealthService saasAdminHealthService
    ) {
        this.saasPlanService = saasPlanService;
        this.saasAdminService = saasAdminService;
        this.superAdminAuditService = superAdminAuditService;
        this.saasAdminHealthService = saasAdminHealthService;
    }

    @GetMapping("/subscriptions")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<GymSubscriptionDTO>> getAllSubscriptions() {
        return ResponseEntity.ok(saasAdminService.getAllSubscriptions());
    }

    @GetMapping("/subscriptions/export.csv")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportSubscriptionsCsv() {
        byte[] body = saasAdminService.exportSubscriptionsCsv().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"subscriptions.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SaaSAdminStatsDTO> getSaaSStats() {
        return ResponseEntity.ok(saasAdminService.getSaaSStats());
    }

    @GetMapping("/health")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SaaSHealthDTO> getHealth() {
        return ResponseEntity.ok(saasAdminHealthService.getHealth());
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<SuperAdminAuditLogDTO>> getAuditLogs() {
        return ResponseEntity.ok(superAdminAuditService.recentLogs());
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

    @PutMapping("/plans/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<SaaSPlan> updatePlan(@PathVariable Long id, @Valid @RequestBody UpdateSaaSPlanRequest request) {
        return ResponseEntity.ok(saasPlanService.updatePlan(id, request));
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
        com.jagorczyk.gymManagement.domain.SubscriptionStatus status =
                com.jagorczyk.gymManagement.domain.SubscriptionStatus.valueOf(statusStr);
        saasAdminService.updateSubscriptionStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/subscriptions/{id}/extend")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<GymSubscriptionDTO> extendSubscription(
            @PathVariable Long id,
            @Valid @RequestBody ExtendSubscriptionRequest request
    ) {
        return ResponseEntity.ok(saasAdminService.extendSubscription(id, request.days(), request.reactivate()));
    }

    @PutMapping("/subscriptions/{id}/notes")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<GymSubscriptionDTO> updateSubscriptionNotes(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSubscriptionNotesRequest request
    ) {
        return ResponseEntity.ok(saasAdminService.updateSubscriptionNotes(id, request.adminNotes()));
    }

    @PutMapping("/subscriptions/{id}/feature-overrides")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<GymSubscriptionDTO> updateFeatureOverrides(
            @PathVariable Long id,
            @RequestBody UpdateFeatureOverridesRequest request
    ) {
        return ResponseEntity.ok(saasAdminService.updateFeatureOverrides(id, request.overrides()));
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

    @GetMapping("/users/export.csv")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportUsersCsv() {
        byte[] body = saasAdminService.exportUsersCsv().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }

    @PostMapping("/users/{id}/impersonate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ImpersonationResponse> impersonateUser(@PathVariable Long id) {
        return ResponseEntity.ok(saasAdminService.impersonateUser(id));
    }

    @PostMapping("/users/{id}/resend-verification")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> resendVerification(@PathVariable Long id) {
        saasAdminService.resendUserVerification(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        saasAdminService.deleteUserCompletely(id);
        return ResponseEntity.ok().build();
    }
}

package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.domain.SaaSPlan;
import com.jagorczyk.gymManagement.service.SaaSPlanService;
import com.jagorczyk.gymManagement.service.TenantRegistrationService;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/tenant")
@RequiredArgsConstructor
public class TenantRegistrationController {

    private final TenantRegistrationService tenantRegistrationService;
    private final SaaSPlanService saasPlanService;

    @GetMapping("/plans")
    public ResponseEntity<List<SaaSPlan>> getPlans() {
        return ResponseEntity.ok(saasPlanService.getActivePlans());
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerTenant(@RequestBody @Valid TenantRegistrationRequest request) {
        try {
            String result = tenantRegistrationService.registerTenant(request);
            return ResponseEntity.ok(Map.of("status", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (StripeException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Payment service error: " + e.getMessage()));
        }
    }
}

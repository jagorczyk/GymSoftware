package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.CreateSaaSPlanRequest;
import com.jagorczyk.gymManagement.api.UpdateSaaSPlanRequest;
import com.jagorczyk.gymManagement.domain.SaaSPlan;
import com.jagorczyk.gymManagement.repository.GymSubscriptionRepository;
import com.jagorczyk.gymManagement.repository.SaaSPlanRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SaaSPlanService {
    private final SaaSPlanRepository saasPlanRepository;
    private final GymSubscriptionRepository gymSubscriptionRepository;

    public List<SaaSPlan> getAllPlans() {
        return saasPlanRepository.findAll();
    }

    public List<SaaSPlan> getActivePlans() {
        return saasPlanRepository.findByIsActiveTrue();
    }

    public SaaSPlan getPlanById(Long id) {
        return saasPlanRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono planu SaaS"));
    }

    @Transactional
    public SaaSPlan createPlan(CreateSaaSPlanRequest request) {
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Nazwa planu jest wymagana");
        }

        SaaSPlan plan = new SaaSPlan();
        plan.setName(name);
        plan.setPrice(request.price());
        plan.setFeatures(request.features() != null ? request.features().trim() : null);
        plan.setActive(request.active() == null || request.active());
        if (request.featureFlags() != null) {
            plan.setFeatureFlags(request.featureFlags());
        } else {
            plan.setFeatureFlags(null);
        }
        return saasPlanRepository.save(plan);
    }

    @Transactional
    public SaaSPlan updatePlan(Long id, UpdateSaaSPlanRequest request) {
        SaaSPlan plan = getPlanById(id);
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Nazwa planu jest wymagana");
        }
        plan.setName(name);
        plan.setPrice(request.price());
        plan.setFeatures(request.features() != null ? request.features().trim() : null);
        if (request.active() != null) {
            plan.setActive(request.active());
        }
        if (request.featureFlags() != null) {
            plan.setFeatureFlags(request.featureFlags());
        }
        return saasPlanRepository.save(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        SaaSPlan plan = getPlanById(id);
        long subscriptionCount = gymSubscriptionRepository.countBySaasPlan_Id(id);
        if (subscriptionCount > 0) {
            throw new IllegalArgumentException(
                "Nie można usunąć planu \"" + plan.getName() + "\" — jest przypisany do "
                    + subscriptionCount + " subskrypcji. Dezaktywuj plan zamiast usuwać."
            );
        }
        saasPlanRepository.delete(plan);
    }
}

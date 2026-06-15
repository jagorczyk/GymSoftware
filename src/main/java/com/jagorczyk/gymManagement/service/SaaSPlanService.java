package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.SaaSPlan;
import com.jagorczyk.gymManagement.repository.SaaSPlanRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SaaSPlanService {
    private final SaaSPlanRepository saasPlanRepository;

    public List<SaaSPlan> getAllPlans() {
        return saasPlanRepository.findAll();
    }

    public SaaSPlan getPlanById(Long id) {
        return saasPlanRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("SaaS Plan not found"));
    }

    public SaaSPlan createPlan(SaaSPlan plan) {
        return saasPlanRepository.save(plan);
    }
}

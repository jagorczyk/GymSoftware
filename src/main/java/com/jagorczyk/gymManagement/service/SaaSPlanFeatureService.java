package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.GymSubscription;
import com.jagorczyk.gymManagement.domain.SaaSPlanFeature;
import com.jagorczyk.gymManagement.repository.GymSubscriptionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SaaSPlanFeatureService {
    private final GymSubscriptionRepository gymSubscriptionRepository;

    @Transactional(readOnly = true)
    public List<SaaSPlanFeature> getGymPlanFeatures(Long gymId) {
        return gymSubscriptionRepository.findByGymId(gymId)
                .map(sub -> SaaSPlanFeatureFlags.resolveEffective(
                        sub.getSaasPlan().getFeatureFlagsJson(),
                        sub.getFeatureFlagOverridesJson()))
                .orElse(SaaSPlanFeature.all());
    }

    @Transactional(readOnly = true)
    public boolean gymHasFeature(Long gymId, SaaSPlanFeature feature) {
        return getGymPlanFeatures(gymId).contains(feature);
    }
}

package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.GymSubscription;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GymSubscriptionRepository extends JpaRepository<GymSubscription, Long> {
    Optional<GymSubscription> findByGymId(Long gymId);
    Optional<GymSubscription> findByStripeSubscriptionId(String stripeSubscriptionId);
}

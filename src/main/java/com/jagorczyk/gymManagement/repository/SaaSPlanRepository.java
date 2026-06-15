package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.SaaSPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SaaSPlanRepository extends JpaRepository<SaaSPlan, Long> {
}

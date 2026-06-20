package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.Gym;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GymRepository extends JpaRepository<Gym, Long> {
    List<Gym> findByOwnerUserId(Long ownerUserId);
    java.util.Optional<Gym> findBySubdomain(String subdomain);
    boolean existsBySubdomain(String subdomain);
}

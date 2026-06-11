package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.Guest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestRepository extends JpaRepository<Guest, Long> {
    List<Guest> findByGymId(Long gymId);

    long countByGymId(Long gymId);

    List<Guest> findByUserId(Long userId);

    java.util.Optional<Guest> findByUserIdAndGymId(Long userId, Long gymId);

    long countByGymIdAndCreatedAtBetween(Long gymId, java.time.LocalDateTime start, java.time.LocalDateTime end);
}

package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.GymNotification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GymNotificationRepository extends JpaRepository<GymNotification, Long> {
    List<GymNotification> findTop50ByGymIdOrderByCreatedAtDesc(Long gymId);

    long countByGymIdAndReadAtIsNull(Long gymId);

    boolean existsByGymIdAndTypeAndPassIdAndCreatedAtAfter(
            Long gymId,
            String type,
            Long passId,
            java.time.LocalDateTime createdAt
    );
}

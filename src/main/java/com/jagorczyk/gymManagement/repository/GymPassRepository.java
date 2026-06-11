package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.PassStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.jagorczyk.gymManagement.api.dto.AnalyticsDtos.PassTypePopularity;

public interface GymPassRepository extends JpaRepository<GymPass, Long> {
    List<GymPass> findByGymId(Long gymId);

    List<GymPass> findByGymIdAndStatus(Long gymId, PassStatus status);

    List<GymPass> findByStatusAndEndDateBefore(PassStatus status, LocalDate endDate);

    List<GymPass> findByGuestId(Long guestId);

    long countByGymId(Long gymId);

    @Query("SELECT new com.jagorczyk.gymManagement.api.dto.AnalyticsDtos$PassTypePopularity(p.passType, COUNT(p)) FROM GymPass p WHERE p.gym.id = :gymId AND p.createdAt >= :startDate GROUP BY p.passType")
    List<PassTypePopularity> countPassTypesByGymIdSince(@Param("gymId") Long gymId, @Param("startDate") java.time.LocalDateTime startDate);

    List<GymPass> findByGymIdAndCreatedAtGreaterThanEqual(Long gymId, java.time.LocalDateTime startDate);
}

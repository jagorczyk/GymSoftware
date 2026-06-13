package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.GroupClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GroupClassRepository extends JpaRepository<GroupClass, Long> {
    List<GroupClass> findByGymIdAndStartTimeBetweenOrderByStartTimeAsc(Long gymId, LocalDateTime start, LocalDateTime end);
    Optional<GroupClass> findByIdAndGymId(Long id, Long gymId);

    @Query("SELECT COUNT(r) FROM ClassReservation r WHERE r.groupClass.id = :classId AND r.status IN (com.jagorczyk.gymManagement.domain.ClassReservationStatus.RESERVED, com.jagorczyk.gymManagement.domain.ClassReservationStatus.ATTENDED)")
    long countActiveReservations(Long classId);
}

package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.ClassReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassReservationRepository extends JpaRepository<ClassReservation, Long> {
    List<ClassReservation> findByGroupClassId(Long classId);
    List<ClassReservation> findByGuestId(Long guestId);
    Optional<ClassReservation> findByGroupClassIdAndGuestId(Long classId, Long guestId);
    long countByGroupClassIdAndStatusNot(Long classId, com.jagorczyk.gymManagement.domain.ClassReservationStatus status);
    List<ClassReservation> findByGroupClassIdAndStatusOrderByReservedAtAsc(Long classId, com.jagorczyk.gymManagement.domain.ClassReservationStatus status);
}

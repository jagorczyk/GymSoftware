package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.GuestCheckIn;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestCheckInRepository extends JpaRepository<GuestCheckIn, Long> {
    List<GuestCheckIn> findByGymIdAndCheckedOutAtIsNull(Long gymId);

    Optional<GuestCheckIn> findByGuestIdAndCheckedOutAtIsNull(Long guestId);

    boolean existsByGuestIdAndCheckedOutAtIsNull(Long guestId);

    List<GuestCheckIn> findByGymIdAndCheckedInAtBetween(Long gymId, java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countByGymIdAndCheckedInAtBetween(Long gymId, java.time.LocalDateTime start, java.time.LocalDateTime end);
}

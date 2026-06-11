package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.LockerAssignment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LockerAssignmentRepository extends JpaRepository<LockerAssignment, Long> {
    List<LockerAssignment> findByLockerGymIdAndReturnedAtIsNull(Long gymId);

    List<LockerAssignment> findByGuestIdAndReturnedAtIsNull(Long guestId);

    List<LockerAssignment> findByLockerIdAndReturnedAtIsNull(Long lockerId);
}

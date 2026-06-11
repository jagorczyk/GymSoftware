package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.WorkScheduleEntry;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkScheduleEntryRepository extends JpaRepository<WorkScheduleEntry, Long> {
    List<WorkScheduleEntry> findByGymIdAndStartAtBeforeAndEndAtAfter(
            Long gymId,
            LocalDateTime to,
            LocalDateTime from
    );

    List<WorkScheduleEntry> findByGymIdAndEmployeeIdAndStartAtBeforeAndEndAtAfter(
            Long gymId,
            Long employeeId,
            LocalDateTime to,
            LocalDateTime from
    );

    Optional<WorkScheduleEntry> findByIdAndGymId(Long id, Long gymId);
}

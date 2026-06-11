package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.CalendarEvent;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByGymIdAndStartAtBeforeAndEndAtAfter(
            Long gymId,
            LocalDateTime rangeEnd,
            LocalDateTime rangeStart
    );

    Optional<CalendarEvent> findByIdAndGymId(Long id, Long gymId);
}

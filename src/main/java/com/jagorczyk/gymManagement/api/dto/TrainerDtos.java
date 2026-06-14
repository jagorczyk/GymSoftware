package com.jagorczyk.gymManagement.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class TrainerDtos {
    private TrainerDtos() {}

    public record TrainerAvailabilityView(
            Long id,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            Integer slotDurationMinutes
    ) {}

    public record UpdateTrainerAvailabilityRequest(
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            Integer slotDurationMinutes
    ) {}

    public record UpdateTrainerProfileRequest(
            String bio,
            String specialization,
            BigDecimal hourlyRate,
            List<UpdateTrainerAvailabilityRequest> availabilities
    ) {}

    public record MyTrainerProfileView(
            Long id,
            String bio,
            String specialization,
            BigDecimal hourlyRate,
            List<TrainerAvailabilityView> availabilities
    ) {}

    public record TrainerTrainingView(
            Long id,
            Long clientId,
            String clientFirstName,
            String clientLastName,
            java.time.LocalDateTime scheduledAt,
            BigDecimal price,
            boolean isPaid,
            String status
    ) {}
}

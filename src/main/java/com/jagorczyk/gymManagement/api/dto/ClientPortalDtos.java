package com.jagorczyk.gymManagement.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class ClientPortalDtos {
    private ClientPortalDtos() {}

    public record ClientGymView(
            Long id,
            String name,
            String address
    ) {}

    public record JoinGymRequest(
            Long gymId,
            String firstName,
            String lastName,
            String phone
    ) {}

    public record ClientDashboardView(
            List<ClientPassView> activePasses
    ) {}

    public record ClientPassTypeView(
            Long id,
            String name,
            BigDecimal price,
            Integer durationDays
    ) {}

    public record ClientPassView(
            Long id,
            String passType,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal price
    ) {}

    public record PurchasePassRequest(
            Long passTypeId
    ) {}

    public record PurchasePassResponse(
            String checkoutUrl
    ) {}

    public record RateClassRequest(
            Integer rating,
            String comment
    ) {}

    public record ClassRatingView(
            Long id,
            Long groupClassId,
            String className,
            String guestName,
            Integer rating,
            String comment,
            java.time.LocalDateTime createdAt
    ) {}

    public record FreezePassRequest(
            java.time.LocalDate startDate,
            java.time.LocalDate endDate
    ) {}

    public record TrainerProfileView(
            Long id,
            Long employeeId,
            String firstName,
            String lastName,
            String bio,
            String specialization,
            BigDecimal hourlyRate
    ) {}

    public record PersonalTrainingView(
            Long id,
            Long trainerId,
            String trainerFirstName,
            String trainerLastName,
            java.time.LocalDateTime scheduledAt,
            BigDecimal price,
            boolean isPaid,
            String status
    ) {}

    public record BookTrainingRequest(
            java.time.LocalDateTime scheduledAt
    ) {}

    public record AvailableSlotView(
            java.time.LocalTime time
    ) {}

    public record ScheduleSlotView(
            java.time.LocalTime time,
            boolean available
    ) {}

    public record TrainerScheduleDayView(
            java.time.LocalDate date,
            java.util.List<ScheduleSlotView> slots
    ) {}
}

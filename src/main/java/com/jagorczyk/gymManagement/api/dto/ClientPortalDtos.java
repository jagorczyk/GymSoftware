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
}

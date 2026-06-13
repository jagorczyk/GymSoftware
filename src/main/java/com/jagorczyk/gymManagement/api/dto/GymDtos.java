package com.jagorczyk.gymManagement.api.dto;

import com.jagorczyk.gymManagement.domain.LockerStatus;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.WorkScheduleEntryType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public final class GymDtos {
    private GymDtos() {
    }

    public record GymSummary(Long id, String name, String address) {}
    public record GuestView(
            Long id,
            String firstName,
            String lastName,
            String email,
            String phone,
            String notes,
            boolean hasActivePass,
            boolean isPresent,
            boolean hasLocker,
            LocalDate activePassEndDate,
            String avatarUrl
    ) {}

    public record GuestDetailView(GuestView guest, List<PassView> passes) {}
    public record EmployeeView(Long id, Long userId, String email, List<String> permissions, Long rankId, String rankName, String avatarUrl) {}
    public record PassView(Long id, Long guestId, String passType, PassStatus status, LocalDate startDate, LocalDate endDate, BigDecimal price) {}
    public record LockerView(Long id, String lockerNumber, LockerStatus status, Long guestId) {}
    public record AuditLogView(Long id, String action, String payload, LocalDateTime createdAt, String actorEmail) {}
    public record PassTypeView(Long id, String name, BigDecimal price, Integer durationDays) {}

    public record OwnerGymDetails(
            GymSummary gym,
            List<GuestView> guests,
            List<EmployeeView> employees,
            List<PassView> passes,
            List<LockerView> lockers,
            List<AuditLogView> logs,
            List<PassTypeView> passTypes
    ) {}

    public record SellPassRequest(
            @NotNull Long guestId,
            @NotBlank String passType,
            @NotNull @FutureOrPresent LocalDate startDate,
            @NotNull @FutureOrPresent LocalDate endDate,
            @NotNull @DecimalMin("0.00") BigDecimal price
    ) {}

    public record CreatePassTypeRequest(
            @NotBlank String name,
            @NotNull @DecimalMin("0.01") BigDecimal price,
            @NotNull Integer durationDays
    ) {}

    public record AssignLockerRequest(
            @NotNull Long lockerId,
            @NotNull Long guestId
    ) {}

    public record CreateGymRequest(
            @NotBlank String name,
            String address
    ) {}

    public record CreateEmployeeRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            Set<EmployeePermission> permissions,
            Long rankId,
            String avatarUrl
    ) {}

    public record UpdateGymRequest(
            @NotBlank String name,
            String address
    ) {}

    public record UpdateEmployeeRequest(
            @Email @NotBlank String email,
            String password,
            Set<EmployeePermission> permissions,
            Long rankId,
            String avatarUrl
    ) {}

    public record EmployeeGymView(
            Long employeeId,
            Long gymId,
            String gymName,
            String gymAddress,
            List<String> permissions
    ) {}

    public record LiveLockerView(
            Long lockerId,
            String lockerNumber,
            Long guestId,
            String guestName,
            LocalDateTime assignedAt
    ) {}

    public record LiveGuestView(
            Long guestId,
            String firstName,
            String lastName,
            String email
    ) {}

    public record ExpiringPassView(
            Long guestId,
            String firstName,
            String lastName,
            LocalDate endDate,
            long daysRemaining
    ) {}

    public record EmployeeLiveOverview(
            List<LiveLockerView> activeKeys,
            List<LiveGuestView> presentGuests,
            List<LockerView> allLockers,
            List<PassTypeView> passTypes,
            List<ExpiringPassView> expiringPasses,
            BigDecimal salesLast7Days
    ) {}

    public record CreateGuestRequest(
            @NotBlank String firstName,
            @NotBlank String lastName,
            @Email String email,
            String phone,
            String notes,
            String avatarUrl
    ) {}

    public record UpdateGuestRequest(
            @NotBlank String firstName,
            @NotBlank String lastName,
            @Email String email,
            String phone,
            String notes,
            String avatarUrl
    ) {}

    public record RenewPassRequest(
            @NotNull LocalDate endDate,
            @NotNull @DecimalMin("0.00") BigDecimal price
    ) {}

    public record UpdatePassTypeRequest(
            @NotBlank String name,
            @NotNull @DecimalMin("0.01") BigDecimal price,
            @NotNull Integer durationDays
    ) {}

    public record SalesReportDay(LocalDate date, BigDecimal total, int count) {}

    public record SalesByPassType(String passType, BigDecimal total, int count) {}

    public record SalesReport(
            LocalDate from,
            LocalDate to,
            BigDecimal total,
            int passCount,
            List<SalesReportDay> days,
            List<SalesByPassType> byPassType
    ) {}

    public record NotificationView(
            Long id,
            String type,
            String title,
            String message,
            Long guestId,
            Long passId,
            LocalDateTime createdAt,
            LocalDateTime readAt,
            LocalDateTime emailSentAt
    ) {}

    public record NotificationSettingsView(
            boolean expiringPassEmailEnabled,
            int expiringPassDaysBefore,
            String notificationEmail
    ) {}

    public record UpdateNotificationSettingsRequest(
            boolean expiringPassEmailEnabled,
            @NotNull Integer expiringPassDaysBefore,
            String notificationEmail
    ) {}

    public record CreateLockerRequest(
            @NotBlank String lockerNumber
    ) {}

    public record CalendarEventView(
            Long id,
            String title,
            String description,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String color,
            Long createdByUserId,
            String createdByEmail,
            boolean canEdit
    ) {}

    public record CreateCalendarEventRequest(
            @NotBlank String title,
            String description,
            @NotNull LocalDateTime startAt,
            @NotNull LocalDateTime endAt,
            String color
    ) {}

    public record UpdateCalendarEventRequest(
            @NotBlank String title,
            String description,
            @NotNull LocalDateTime startAt,
            @NotNull LocalDateTime endAt,
            String color
    ) {}

    public record WorkScheduleEntryView(
            Long id,
            Long employeeId,
            String employeeName,
            WorkScheduleEntryType entryType,
            String title,
            String note,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String color,
            boolean canEdit
    ) {}

    public record CreateWorkScheduleEntryRequest(
            @NotNull Long employeeId,
            @NotNull WorkScheduleEntryType entryType,
            String title,
            String note,
            @NotNull LocalDateTime startAt,
            @NotNull LocalDateTime endAt
    ) {}

    public record UpdateWorkScheduleEntryRequest(
            @NotNull Long employeeId,
            @NotNull WorkScheduleEntryType entryType,
            String title,
            String note,
            @NotNull LocalDateTime startAt,
            @NotNull LocalDateTime endAt
    ) {}

    public record RankView(
            Long id,
            String name,
            List<String> permissions
    ) {}

    public record CreateRankRequest(
            @NotBlank String name,
            Set<EmployeePermission> permissions
    ) {}

    public record UpdateRankRequest(
            @NotBlank String name,
            Set<EmployeePermission> permissions
    ) {}

    public record ProductView(
            Long id,
            String name,
            BigDecimal price,
            Integer quantity,
            String category
    ) {}

    public record CreateProductRequest(
            @NotBlank String name,
            @NotNull @DecimalMin("0.00") BigDecimal price,
            @NotNull Integer quantity,
            @NotBlank String category
    ) {}

    public record UpdateProductRequest(
            @NotBlank String name,
            @NotNull @DecimalMin("0.00") BigDecimal price,
            @NotNull Integer quantity,
            @NotBlank String category
    ) {}

    public record ProductSaleItemRequest(
            @NotNull Long productId,
            @NotNull Integer quantity
    ) {}

    public record ProductSaleRequest(
            Long guestId,
            @NotNull List<ProductSaleItemRequest> items,
            @NotBlank String paymentMethod
    ) {}

    public record ProductSaleItemView(
            Long id,
            Long productId,
            String productName,
            Integer quantity,
            BigDecimal unitPrice
    ) {}

    public record ProductSaleView(
            Long id,
            String soldByEmail,
            String guestName,
            BigDecimal totalAmount,
            String paymentMethod,
            LocalDateTime createdAt,
            List<ProductSaleItemView> items
    ) {}
}

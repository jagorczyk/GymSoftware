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

    public record GymSummary(Long id, String name, String address, String city, String postalCode, String nip, String themeColor, String subdomain) {}
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

    public record GuestDetailView(GuestView guest, List<PassView> passes, List<CheckInView> recentCheckIns, List<PassFreezeView> activeFreezes) {}
    public record EmployeeView(Long id, Long userId, String email, String firstName, String lastName, List<String> permissions, Long rankId, String rankName, String avatarUrl) {}
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
            String address,
            String city,
            @jakarta.validation.constraints.Pattern(regexp = "^\\d{2}-\\d{3}$", message = "Nieprawidłowy kod pocztowy") String postalCode,
            @jakarta.validation.constraints.Pattern(regexp = "^\\d{10}$", message = "NIP musi składać się z 10 cyfr") String nip,
            String themeColor
    ) {}

    public record CreateEmployeeRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            String firstName,
            String lastName,
            Set<EmployeePermission> permissions,
            Long rankId,
            String avatarUrl
    ) {}

    public record UpdateGymRequest(
            @NotBlank String name,
            @NotBlank(message = "Adres jest wymagany")
            @jakarta.validation.constraints.Size(min = 5, message = "Podaj pełny adres ulicy i numer")
            @jakarta.validation.constraints.Pattern(
                    regexp = "^(?=.*[A-Za-zÀ-žĄĆĘŁŃÓŚŹŻąćęłńóśźż]).+$",
                    message = "Adres musi zawierać nazwę ulicy"
            )
            String address,
            @NotBlank(message = "Miasto jest wymagane") String city,
            @jakarta.validation.constraints.Pattern(regexp = "^\\d{2}-\\d{3}$", message = "Nieprawidłowy kod pocztowy (format 00-000)") String postalCode,
            @jakarta.validation.constraints.Pattern(regexp = "^\\d{10}$", message = "NIP musi składać się z 10 cyfr") String nip,
            String themeColor
    ) {}

    public record UpdateEmployeeRequest(
            @Email @NotBlank String email,
            String password,
            String firstName,
            String lastName,
            Set<EmployeePermission> permissions,
            Long rankId,
            String avatarUrl
    ) {}

    public record EmployeeGymView(
            Long employeeId,
            Long gymId,
            String gymName,
            String gymAddress,
            String themeColor,
            String subdomain,
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
            BigDecimal productRevenue,
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

    public record UpdateGymThemeRequest(
            @NotBlank String themeColor
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
            String category,
            String barcode
    ) {}

    public record CreateProductRequest(
            @NotBlank String name,
            @NotNull @DecimalMin("0.00") BigDecimal price,
            @NotNull Integer quantity,
            @NotBlank String category,
            String barcode
    ) {}

    public record UpdateProductRequest(
            @NotBlank String name,
            @NotNull @DecimalMin("0.00") BigDecimal price,
            @NotNull Integer quantity,
            @NotBlank String category,
            String barcode
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

    public record PassFreezeView(Long id, Long passId, LocalDate startDate, LocalDate endDate, boolean processed) {}
    public record CheckInView(Long id, LocalDateTime checkedInAt, LocalDateTime checkedOutAt) {}
    public record ClassRatingView(Long id, Long classId, Long guestId, String guestName, Integer rating, String comment, LocalDateTime createdAt) {}
    public record ClassRatingSummary(Long classId, String className, String instructorName, Double avgRating, Long ratingCount) {}
    public record FreezePassRequest(@NotNull LocalDate startDate, @NotNull LocalDate endDate) {}

    public record CreateEmailCampaignRequest(
            @NotBlank String subject,
            @NotBlank String body,
            @NotBlank String targetSegment,
            LocalDateTime scheduledAt,
            String imageUrl
    ) {}

    public record EmailCampaignView(
            Long id,
            String subject,
            String body,
            String targetSegment,
            String status,
            LocalDateTime createdAt,
            LocalDateTime sentAt,
            LocalDateTime scheduledAt,
            String imageUrl
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

    public record CreateTrainerProfileRequest(
            @NotNull Long employeeId,
            String bio,
            String specialization,
            @NotNull @DecimalMin("0.00") BigDecimal hourlyRate
    ) {}

    public record UpdateTrainerProfileRequest(
            String bio,
            String specialization,
            @NotNull @DecimalMin("0.00") BigDecimal hourlyRate
    ) {}

    public record GymSubscriptionView(
            Long id,
            Long saasPlanId,
            String saasPlanName,
            String status,
            String currentPeriodStart,
            String currentPeriodEnd,
            java.util.List<String> featureFlags
    ) {}
}

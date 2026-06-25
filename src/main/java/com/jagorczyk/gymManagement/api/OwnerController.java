package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CalendarEventView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateCalendarEventRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateEmployeeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateGymRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateLockerRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreatePassTypeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.EmployeeView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.AuditLogView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestDetailView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GymSummary;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ImportEmployeesRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ImportEmployeesResult;
import com.jagorczyk.gymManagement.api.dto.GymDtos.OwnerOrganizationSettingsView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateOwnerOrganizationSettingsRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.LockerView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.NotificationSettingsView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.NotificationView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.OwnerGymDetails;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassTypeView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.RenewPassRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.SalesReport;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateCalendarEventRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateEmployeeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateGuestRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateGymRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateGymThemeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateNotificationSettingsRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdatePassTypeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.RankView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateRankRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateRankRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ProductView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateProductRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateProductRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ProductSaleView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ClassRatingView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ClassRatingSummary;
import com.jagorczyk.gymManagement.service.PosService;
import com.jagorczyk.gymManagement.service.NotificationService;
import com.jagorczyk.gymManagement.service.PassService;
import com.jagorczyk.gymManagement.service.SalesReportService;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateWorkScheduleEntryRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateWorkScheduleEntryRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.WorkScheduleEntryView;
import com.jagorczyk.gymManagement.service.CalendarService;
import com.jagorczyk.gymManagement.service.CurrentUserService;
import com.jagorczyk.gymManagement.service.OwnerService;
import com.jagorczyk.gymManagement.service.OwnerSettingsService;
import com.jagorczyk.gymManagement.service.WorkScheduleService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasRole('OWNER')")
public class OwnerController {
    private final OwnerService ownerService;
    private final CalendarService calendarService;
    private final WorkScheduleService workScheduleService;
    private final CurrentUserService currentUserService;
    private final PassService passService;
    private final SalesReportService salesReportService;
    private final NotificationService notificationService;
    private final PosService posService;
    private final com.jagorczyk.gymManagement.service.GroupClassService groupClassService;
    private final OwnerSettingsService ownerSettingsService;

    public OwnerController(
            OwnerService ownerService,
            CalendarService calendarService,
            WorkScheduleService workScheduleService,
            CurrentUserService currentUserService,
            PassService passService,
            SalesReportService salesReportService,
            NotificationService notificationService,
            PosService posService,
            com.jagorczyk.gymManagement.service.GroupClassService groupClassService,
            OwnerSettingsService ownerSettingsService
    ) {
        this.ownerService = ownerService;
        this.calendarService = calendarService;
        this.workScheduleService = workScheduleService;
        this.currentUserService = currentUserService;
        this.passService = passService;
        this.salesReportService = salesReportService;
        this.notificationService = notificationService;
        this.posService = posService;
        this.groupClassService = groupClassService;
        this.ownerSettingsService = ownerSettingsService;
    }

    @GetMapping("/gyms")
    public List<GymSummary> listGyms() {
        return ownerService.ownerGyms(currentUserService.getCurrentUser().getId());
    }

    @GetMapping("/gyms/{gymId}/details")
    public OwnerGymDetails gymDetails(@PathVariable Long gymId) {
        return ownerService.gymDetails(currentUserService.getCurrentUser().getId(), gymId);
    }

    @GetMapping("/gyms/{gymId}/dashboard-stats")
    public com.jagorczyk.gymManagement.api.dto.GymDtos.OwnerDashboardStats dashboardStats(@PathVariable Long gymId) {
        return ownerService.dashboardStats(currentUserService.getCurrentUser().getId(), gymId);
    }

    @GetMapping("/gyms/{gymId}/guests")
    public com.jagorczyk.gymManagement.api.dto.GymDtos.PageResponse<GuestView> listGuests(
            @PathVariable Long gymId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ownerService.ownerGuests(currentUserService.getCurrentUser().getId(), gymId, q, page, size);
    }

    @PostMapping("/gyms")
    public GymSummary createGym(@Valid @RequestBody CreateGymRequest request) {
        return ownerService.createGym(currentUserService.getCurrentUser().getId(), request);
    }

    @PostMapping("/gyms/{gymId}/checkout")
    public Map<String, String> checkoutSaaS(@PathVariable Long gymId) {
        String url = ownerService.createGymSubscriptionCheckout(currentUserService.getCurrentUser().getId(), gymId);
        return Map.of("checkoutUrl", url);
    }

    @GetMapping("/gyms/{gymId}/subscription")
    public com.jagorczyk.gymManagement.api.dto.GymDtos.GymSubscriptionView getSubscription(@PathVariable Long gymId) {
        return ownerService.getGymSubscription(currentUserService.getCurrentUser().getId(), gymId);
    }

    @PostMapping("/gyms/{gymId}/subscription/portal")
    public Map<String, String> customerPortalSession(@PathVariable Long gymId) {
        String url = ownerService.createCustomerPortalSession(currentUserService.getCurrentUser().getId(), gymId);
        return Map.of("portalUrl", url);
    }

    @PostMapping("/gyms/{gymId}/employees")
    public EmployeeView createEmployee(@PathVariable Long gymId, @Valid @RequestBody CreateEmployeeRequest request) {
        return ownerService.createEmployee(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PostMapping("/gyms/{gymId}/lockers")
    public LockerView createLocker(@PathVariable Long gymId, @Valid @RequestBody CreateLockerRequest request) {
        return ownerService.createLocker(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}")
    public GymSummary updateGym(@PathVariable Long gymId, @Valid @RequestBody UpdateGymRequest request) {
        return ownerService.updateGym(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}/theme")
    public GymSummary updateGymTheme(@PathVariable Long gymId, @Valid @RequestBody UpdateGymThemeRequest request) {
        return ownerService.updateGymTheme(currentUserService.getCurrentUser().getId(), gymId, request.themeColor());
    }

    @DeleteMapping("/gyms/{gymId}")
    public Map<String, String> deleteGym(@PathVariable Long gymId) {
        ownerService.deleteGym(currentUserService.getCurrentUser().getId(), gymId);
        return Map.of("status", "deleted");
    }

    @PutMapping("/gyms/{gymId}/employees/{employeeId}")
    public EmployeeView updateEmployee(
            @PathVariable Long gymId,
            @PathVariable Long employeeId,
            @RequestBody @Valid UpdateEmployeeRequest request
    ) {
        return ownerService.updateEmployee(currentUserService.getCurrentUser().getId(), gymId, employeeId, request);
    }

    @DeleteMapping("/gyms/{gymId}/employees/{employeeId}")
    public void deleteEmployee(
            @PathVariable Long gymId,
            @PathVariable Long employeeId
    ) {
        ownerService.deleteEmployee(currentUserService.getCurrentUser().getId(), gymId, employeeId);
    }

    @GetMapping("/gyms/{gymId}/ranks")
    public List<RankView> getRanks(@PathVariable Long gymId) {
        return ownerService.getRanks(currentUserService.getCurrentUser().getId(), gymId);
    }

    @PostMapping("/gyms/{gymId}/ranks")
    public RankView createRank(
            @PathVariable Long gymId,
            @RequestBody @Valid CreateRankRequest request
    ) {
        return ownerService.createRank(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}/ranks/{rankId}")
    public RankView updateRank(
            @PathVariable Long gymId,
            @PathVariable Long rankId,
            @RequestBody @Valid UpdateRankRequest request
    ) {
        return ownerService.updateRank(currentUserService.getCurrentUser().getId(), gymId, rankId, request);
    }

    @DeleteMapping("/gyms/{gymId}/ranks/{rankId}")
    public void deleteRank(
            @PathVariable Long gymId,
            @PathVariable Long rankId
    ) {
        ownerService.deleteRank(currentUserService.getCurrentUser().getId(), gymId, rankId);
    }

    @PostMapping("/gyms/{gymId}/pass-types")
    public PassTypeView createPassType(@PathVariable Long gymId, @Valid @RequestBody CreatePassTypeRequest request) {
        return ownerService.createPassType(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @DeleteMapping("/gyms/{gymId}/pass-types/{passTypeId}")
    public Map<String, String> deletePassType(@PathVariable Long gymId, @PathVariable Long passTypeId) {
        ownerService.deletePassType(currentUserService.getCurrentUser().getId(), gymId, passTypeId);
        return Map.of("status", "deleted");
    }

    @PutMapping("/gyms/{gymId}/pass-types/{passTypeId}")
    public PassTypeView updatePassType(
            @PathVariable Long gymId,
            @PathVariable Long passTypeId,
            @Valid @RequestBody UpdatePassTypeRequest request
    ) {
        return ownerService.updatePassType(
                currentUserService.getCurrentUser().getId(), gymId, passTypeId, request);
    }

    @GetMapping("/gyms/{gymId}/guests/{guestId}")
    public GuestDetailView guestDetail(@PathVariable Long gymId, @PathVariable Long guestId) {
        return ownerService.guestDetail(currentUserService.getCurrentUser().getId(), gymId, guestId);
    }

    @PutMapping("/gyms/{gymId}/guests/{guestId}")
    public GuestView updateGuest(
            @PathVariable Long gymId,
            @PathVariable Long guestId,
            @Valid @RequestBody UpdateGuestRequest request
    ) {
        return ownerService.updateGuest(
                currentUserService.getCurrentUser().getId(), gymId, guestId, request);
    }

    @GetMapping("/gyms/{gymId}/audit-logs")
    public List<AuditLogView> auditLogs(
            @PathVariable Long gymId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actorEmail
    ) {
        return ownerService.searchAuditLogs(
                currentUserService.getCurrentUser().getId(), gymId, from, to, action, actorEmail);
    }

    @GetMapping("/gyms/{gymId}/sales-report")
    public SalesReport salesReport(
            @PathVariable Long gymId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return salesReportService.salesReport(
                currentUserService.getCurrentUser().getId(), gymId, from, to);
    }

    @GetMapping("/gyms/{gymId}/notifications")
    public List<NotificationView> notifications(@PathVariable Long gymId) {
        return notificationService.listNotifications(currentUserService.getCurrentUser().getId(), gymId);
    }

    @GetMapping("/gyms/{gymId}/notifications/unread-count")
    public Map<String, Long> unreadNotificationCount(@PathVariable Long gymId) {
        long count = notificationService.unreadCount(currentUserService.getCurrentUser().getId(), gymId);
        return Map.of("count", count);
    }

    @PostMapping("/gyms/{gymId}/notifications/{notificationId}/read")
    public Map<String, String> markNotificationRead(
            @PathVariable Long gymId,
            @PathVariable Long notificationId
    ) {
        notificationService.markRead(currentUserService.getCurrentUser().getId(), gymId, notificationId);
        return Map.of("status", "read");
    }

    @GetMapping("/gyms/{gymId}/notification-settings")
    public NotificationSettingsView notificationSettings(@PathVariable Long gymId) {
        return notificationService.getSettings(currentUserService.getCurrentUser().getId(), gymId);
    }

    @PutMapping("/gyms/{gymId}/notification-settings")
    public NotificationSettingsView updateNotificationSettings(
            @PathVariable Long gymId,
            @Valid @RequestBody UpdateNotificationSettingsRequest request
    ) {
        return notificationService.updateSettings(
                currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PostMapping("/gyms/{gymId}/passes/{passId}/renew")
    public PassView renewPass(
            @PathVariable Long gymId,
            @PathVariable Long passId,
            @Valid @RequestBody RenewPassRequest request
    ) {
        return passService.renewPassForOwner(currentUserService.getCurrentUser().getId(), gymId, passId, request);
    }

    @PostMapping("/gyms/{gymId}/passes/{passId}/cancel")
    public PassView cancelPass(@PathVariable Long gymId, @PathVariable Long passId) {
        return passService.cancelPassForOwner(currentUserService.getCurrentUser().getId(), gymId, passId);
    }

    @GetMapping("/gyms/{gymId}/calendar-events")
    public List<CalendarEventView> calendarEvents(
            @PathVariable Long gymId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return calendarService.listForOwner(currentUserService.getCurrentUser().getId(), gymId, from, to);
    }

    @PostMapping("/gyms/{gymId}/calendar-events")
    public CalendarEventView createCalendarEvent(
            @PathVariable Long gymId,
            @Valid @RequestBody CreateCalendarEventRequest request
    ) {
        return calendarService.createForOwner(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}/calendar-events/{eventId}")
    public CalendarEventView updateCalendarEvent(
            @PathVariable Long gymId,
            @PathVariable Long eventId,
            @Valid @RequestBody UpdateCalendarEventRequest request
    ) {
        return calendarService.updateForOwner(currentUserService.getCurrentUser().getId(), gymId, eventId, request);
    }

    @DeleteMapping("/gyms/{gymId}/calendar-events/{eventId}")
    public Map<String, String> deleteCalendarEvent(@PathVariable Long gymId, @PathVariable Long eventId) {
        calendarService.deleteForOwner(currentUserService.getCurrentUser().getId(), gymId, eventId);
        return Map.of("status", "deleted");
    }

    @GetMapping("/gyms/{gymId}/work-schedule")
    public List<WorkScheduleEntryView> workScheduleEntries(
            @PathVariable Long gymId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Long employeeId
    ) {
        return workScheduleService.listForOwner(
                currentUserService.getCurrentUser().getId(), gymId, from, to, employeeId);
    }

    @PostMapping("/gyms/{gymId}/work-schedule")
    public WorkScheduleEntryView createWorkScheduleEntry(
            @PathVariable Long gymId,
            @Valid @RequestBody CreateWorkScheduleEntryRequest request
    ) {
        return workScheduleService.createForOwner(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}/work-schedule/{entryId}")
    public WorkScheduleEntryView updateWorkScheduleEntry(
            @PathVariable Long gymId,
            @PathVariable Long entryId,
            @Valid @RequestBody UpdateWorkScheduleEntryRequest request
    ) {
        return workScheduleService.updateForOwner(
                currentUserService.getCurrentUser().getId(), gymId, entryId, request);
    }

    @DeleteMapping("/gyms/{gymId}/work-schedule/{entryId}")
    public Map<String, String> deleteWorkScheduleEntry(@PathVariable Long gymId, @PathVariable Long entryId) {
        workScheduleService.deleteForOwner(currentUserService.getCurrentUser().getId(), gymId, entryId);
        return Map.of("status", "deleted");
    }

    @GetMapping("/gyms/{gymId}/products")
    public List<ProductView> getProducts(@PathVariable Long gymId) {
        return posService.getGymProductsForOwner(currentUserService.getCurrentUser().getId(), gymId);
    }

    @PostMapping("/gyms/{gymId}/products")
    public ProductView createProduct(@PathVariable Long gymId, @Valid @RequestBody CreateProductRequest request) {
        return posService.createProduct(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}/products/{productId}")
    public ProductView updateProduct(
            @PathVariable Long gymId,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        return posService.updateProduct(currentUserService.getCurrentUser().getId(), gymId, productId, request);
    }

    @DeleteMapping("/gyms/{gymId}/products/{productId}")
    public Map<String, String> deleteProduct(@PathVariable Long gymId, @PathVariable Long productId) {
        posService.deleteProduct(currentUserService.getCurrentUser().getId(), gymId, productId);
        return Map.of("status", "deleted");
    }

    @GetMapping("/gyms/{gymId}/sales/products")
    public List<ProductSaleView> getProductSales(@PathVariable Long gymId) {
        return posService.getGymSalesForOwner(currentUserService.getCurrentUser().getId(), gymId);
    }

    @GetMapping("/gyms/{gymId}/classes/ratings-summary")
    public List<ClassRatingSummary> getRatingsSummary(@PathVariable Long gymId) {
        return groupClassService.getRatingsSummaryForOwner(currentUserService.getCurrentUser().getId(), gymId);
    }

    @GetMapping("/gyms/{gymId}/classes/{classId}/ratings")
    public List<ClassRatingView> getClassRatings(@PathVariable Long gymId, @PathVariable Long classId) {
        return groupClassService.getRatingsForOwner(currentUserService.getCurrentUser().getId(), gymId, classId);
    }

    @GetMapping("/gyms/{gymId}/sales-report/export.csv")
    public org.springframework.http.ResponseEntity<byte[]> exportSalesReportCsv(
            @PathVariable Long gymId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        SalesReport report = salesReportService.salesReport(currentUserService.getCurrentUser().getId(), gymId, from, to);
        StringBuilder sb = new StringBuilder();
        // BOM for UTF-8
        sb.append('\ufeff');
        sb.append("Data,Cena,Liczba\n");
        for (com.jagorczyk.gymManagement.api.dto.GymDtos.SalesReportDay day : report.days()) {
            sb.append(day.date()).append(",")
              .append(day.total()).append(",")
              .append(day.count()).append("\n");
        }
        byte[] bytes = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"raport.csv\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(bytes);
    }

    @GetMapping("/gyms/{gymId}/trainers")
    public List<com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView> getTrainers(@PathVariable Long gymId) {
        return ownerService.getTrainers(currentUserService.getCurrentUser().getId(), gymId);
    }

    @PostMapping("/gyms/{gymId}/trainers")
    public com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView createTrainer(
            @PathVariable Long gymId,
            @Valid @RequestBody com.jagorczyk.gymManagement.api.dto.GymDtos.CreateTrainerProfileRequest request
    ) {
        return ownerService.createTrainer(currentUserService.getCurrentUser().getId(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}/trainers/{trainerId}")
    public com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView updateTrainer(
            @PathVariable Long gymId,
            @PathVariable Long trainerId,
            @Valid @RequestBody com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateTrainerProfileRequest request
    ) {
        return ownerService.updateTrainer(currentUserService.getCurrentUser().getId(), gymId, trainerId, request);
    }

    @DeleteMapping("/gyms/{gymId}/trainers/{trainerId}")
    public Map<String, String> deleteTrainer(
            @PathVariable Long gymId,
            @PathVariable Long trainerId
    ) {
        ownerService.deleteTrainer(currentUserService.getCurrentUser().getId(), gymId, trainerId);
        return Map.of("status", "deleted");
    }

    @GetMapping("/settings")
    public OwnerOrganizationSettingsView getOrganizationSettings() {
        return ownerSettingsService.getSettings(currentUserService.getCurrentUser().getId());
    }

    @PutMapping("/settings")
    public OwnerOrganizationSettingsView updateOrganizationSettings(
            @Valid @RequestBody UpdateOwnerOrganizationSettingsRequest request
    ) {
        return ownerSettingsService.updateSettings(currentUserService.getCurrentUser().getId(), request);
    }

    @PostMapping("/settings/employees/import")
    public ImportEmployeesResult importEmployees(@Valid @RequestBody ImportEmployeesRequest request) {
        return ownerSettingsService.importEmployees(currentUserService.getCurrentUser().getId(), request);
    }
}

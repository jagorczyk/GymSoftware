package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.GymDtos.AssignLockerRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CalendarEventView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateCalendarEventRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateGuestRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateLockerRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreatePassTypeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.EmployeeGymView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.EmployeeLiveOverview;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.LockerView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassTypeView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.SellPassRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestDetailView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.RenewPassRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateCalendarEventRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateGuestRequest;
import com.jagorczyk.gymManagement.service.PassService;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateWorkScheduleEntryRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateWorkScheduleEntryRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.WorkScheduleEntryView;
import com.jagorczyk.gymManagement.service.CalendarService;
import com.jagorczyk.gymManagement.service.CurrentUserService;
import com.jagorczyk.gymManagement.service.EmployeeService;
import com.jagorczyk.gymManagement.service.WorkScheduleService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employee")
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeController {
    private final EmployeeService employeeService;
    private final CalendarService calendarService;
    private final WorkScheduleService workScheduleService;
    private final CurrentUserService currentUserService;
    private final PassService passService;

    public EmployeeController(
            EmployeeService employeeService,
            CalendarService calendarService,
            WorkScheduleService workScheduleService,
            CurrentUserService currentUserService,
            PassService passService
    ) {
        this.employeeService = employeeService;
        this.calendarService = calendarService;
        this.workScheduleService = workScheduleService;
        this.currentUserService = currentUserService;
        this.passService = passService;
    }

    @GetMapping("/gyms")
    public java.util.List<EmployeeGymView> employeeGyms() {
        return employeeService.employeeGyms(currentUserService.getCurrentUser());
    }

    @GetMapping("/gyms/{gymId}/live")
    public EmployeeLiveOverview liveOverview(@PathVariable Long gymId) {
        return employeeService.liveOverview(currentUserService.getCurrentUser(), gymId);
    }

    @GetMapping("/gyms/{gymId}/guests")
    public java.util.List<GuestView> gymGuests(@PathVariable Long gymId, @RequestParam(required = false) String q) {
        return employeeService.searchGymGuests(currentUserService.getCurrentUser(), gymId, q);
    }

    @PostMapping("/gyms/{gymId}/guests")
    public GuestView createGuest(@PathVariable Long gymId, @Valid @RequestBody CreateGuestRequest request) {
        return employeeService.createGuest(currentUserService.getCurrentUser(), gymId, request);
    }

    @GetMapping("/gyms/{gymId}/guests/{guestId}")
    public GuestDetailView guestDetail(@PathVariable Long gymId, @PathVariable Long guestId) {
        return employeeService.guestDetail(currentUserService.getCurrentUser(), gymId, guestId);
    }

    @PutMapping("/gyms/{gymId}/guests/{guestId}")
    public GuestView updateGuest(
            @PathVariable Long gymId,
            @PathVariable Long guestId,
            @Valid @RequestBody UpdateGuestRequest request
    ) {
        return employeeService.updateGuest(currentUserService.getCurrentUser(), gymId, guestId, request);
    }

    @PostMapping("/gyms/{gymId}/guests/{guestId}/check-in")
    public Map<String, String> checkIn(@PathVariable Long gymId, @PathVariable Long guestId) {
        employeeService.checkIn(currentUserService.getCurrentUser(), gymId, guestId);
        return Map.of("status", "checked_in");
    }

    @PostMapping("/gyms/{gymId}/guests/{guestId}/check-out")
    public Map<String, String> checkOut(@PathVariable Long gymId, @PathVariable Long guestId) {
        employeeService.checkOut(currentUserService.getCurrentUser(), gymId, guestId);
        return Map.of("status", "checked_out");
    }

    @PostMapping("/gyms/{gymId}/passes")
    public PassView sellPass(@PathVariable Long gymId, @Valid @RequestBody SellPassRequest request) {
        return employeeService.sellPass(currentUserService.getCurrentUser(), gymId, request);
    }

    @PostMapping("/gyms/{gymId}/lockers/assign")
    public Map<String, String> assignLocker(@PathVariable Long gymId, @Valid @RequestBody AssignLockerRequest request) {
        employeeService.assignLocker(currentUserService.getCurrentUser(), gymId, request);
        return Map.of("status", "assigned");
    }

    @PostMapping("/gyms/{gymId}/guests/{guestId}/leave")
    public Map<String, String> leaveGym(@PathVariable Long gymId, @PathVariable Long guestId) {
        employeeService.leaveGym(currentUserService.getCurrentUser(), gymId, guestId);
        return Map.of("status", "left");
    }

    @PostMapping("/gyms/{gymId}/guests/{guestId}/lockers/return")
    public Map<String, String> returnLocker(@PathVariable Long gymId, @PathVariable Long guestId) {
        employeeService.returnLocker(currentUserService.getCurrentUser(), gymId, guestId);
        return Map.of("status", "returned");
    }

    @PostMapping("/gyms/{gymId}/passes/{passId}/renew")
    public PassView renewPass(
            @PathVariable Long gymId,
            @PathVariable Long passId,
            @Valid @RequestBody RenewPassRequest request
    ) {
        return passService.renewPassForEmployee(currentUserService.getCurrentUser(), gymId, passId, request);
    }

    @PostMapping("/gyms/{gymId}/passes/{passId}/cancel")
    public PassView cancelPass(@PathVariable Long gymId, @PathVariable Long passId) {
        return passService.cancelPassForEmployee(currentUserService.getCurrentUser(), gymId, passId);
    }

    @GetMapping("/gyms/{gymId}/pass-types")
    public java.util.List<PassTypeView> passTypes(@PathVariable Long gymId) {
        return employeeService.listPassTypes(currentUserService.getCurrentUser(), gymId);
    }

    @PostMapping("/gyms/{gymId}/pass-types")
    public PassTypeView createPassType(@PathVariable Long gymId, @Valid @RequestBody CreatePassTypeRequest request) {
        return employeeService.createPassType(currentUserService.getCurrentUser(), gymId, request);
    }

    @DeleteMapping("/gyms/{gymId}/pass-types/{passTypeId}")
    public Map<String, String> deletePassType(@PathVariable Long gymId, @PathVariable Long passTypeId) {
        employeeService.deletePassType(currentUserService.getCurrentUser(), gymId, passTypeId);
        return Map.of("status", "deleted");
    }

    @PostMapping("/gyms/{gymId}/lockers")
    public LockerView createLocker(@PathVariable Long gymId, @Valid @RequestBody CreateLockerRequest request) {
        return employeeService.createLocker(currentUserService.getCurrentUser(), gymId, request);
    }

    @GetMapping("/gyms/{gymId}/calendar-events")
    public java.util.List<CalendarEventView> calendarEvents(
            @PathVariable Long gymId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return calendarService.listForEmployee(currentUserService.getCurrentUser(), gymId, from, to);
    }

    @PostMapping("/gyms/{gymId}/calendar-events")
    public CalendarEventView createCalendarEvent(
            @PathVariable Long gymId,
            @Valid @RequestBody CreateCalendarEventRequest request
    ) {
        return calendarService.createForEmployee(currentUserService.getCurrentUser(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}/calendar-events/{eventId}")
    public CalendarEventView updateCalendarEvent(
            @PathVariable Long gymId,
            @PathVariable Long eventId,
            @Valid @RequestBody UpdateCalendarEventRequest request
    ) {
        return calendarService.updateForEmployee(currentUserService.getCurrentUser(), gymId, eventId, request);
    }

    @DeleteMapping("/gyms/{gymId}/calendar-events/{eventId}")
    public Map<String, String> deleteCalendarEvent(@PathVariable Long gymId, @PathVariable Long eventId) {
        calendarService.deleteForEmployee(currentUserService.getCurrentUser(), gymId, eventId);
        return Map.of("status", "deleted");
    }

    @GetMapping("/gyms/{gymId}/work-schedule")
    public java.util.List<WorkScheduleEntryView> workScheduleEntries(
            @PathVariable Long gymId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Long employeeId
    ) {
        return workScheduleService.listForEmployee(
                currentUserService.getCurrentUser(), gymId, from, to, employeeId);
    }

    @PostMapping("/gyms/{gymId}/work-schedule")
    public WorkScheduleEntryView createWorkScheduleEntry(
            @PathVariable Long gymId,
            @Valid @RequestBody CreateWorkScheduleEntryRequest request
    ) {
        return workScheduleService.createForEmployee(currentUserService.getCurrentUser(), gymId, request);
    }

    @PutMapping("/gyms/{gymId}/work-schedule/{entryId}")
    public WorkScheduleEntryView updateWorkScheduleEntry(
            @PathVariable Long gymId,
            @PathVariable Long entryId,
            @Valid @RequestBody UpdateWorkScheduleEntryRequest request
    ) {
        return workScheduleService.updateForEmployee(
                currentUserService.getCurrentUser(), gymId, entryId, request);
    }

    @DeleteMapping("/gyms/{gymId}/work-schedule/{entryId}")
    public Map<String, String> deleteWorkScheduleEntry(@PathVariable Long gymId, @PathVariable Long entryId) {
        workScheduleService.deleteForEmployee(currentUserService.getCurrentUser(), gymId, entryId);
        return Map.of("status", "deleted");
    }
}

package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CalendarEventView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateCalendarEventRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateCalendarEventRequest;
import com.jagorczyk.gymManagement.domain.CalendarEvent;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.CalendarEventRepository;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CalendarService {
    private final CalendarEventRepository calendarEventRepository;
    private final GymRepository gymRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeePermissionService employeePermissionService;
    private final AuditLogService auditLogService;

    public CalendarService(
            CalendarEventRepository calendarEventRepository,
            GymRepository gymRepository,
            EmployeeRepository employeeRepository,
            EmployeePermissionService employeePermissionService,
            AuditLogService auditLogService
    ) {
        this.calendarEventRepository = calendarEventRepository;
        this.gymRepository = gymRepository;
        this.employeeRepository = employeeRepository;
        this.employeePermissionService = employeePermissionService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<CalendarEventView> listForOwner(Long ownerUserId, Long gymId, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        validateRange(from, to);
        return calendarEventRepository.findByGymIdAndStartAtBeforeAndEndAtAfter(gymId, to, from).stream()
                .map(event -> toView(event, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CalendarEventView> listForEmployee(User currentUser, Long gymId, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_SCHEDULE);
        validateRange(from, to);
        return calendarEventRepository.findByGymIdAndStartAtBeforeAndEndAtAfter(gymId, to, from).stream()
                .map(event -> toView(event, event.getCreatedByUser().getId().equals(currentUser.getId())))
                .toList();
    }

    @Transactional
    public CalendarEventView createForOwner(Long ownerUserId, Long gymId, CreateCalendarEventRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        User owner = gym.getOwnerUser();
        validateEventTimes(request.startAt(), request.endAt());
        CalendarEvent event = buildEvent(gym, owner, request);
        CalendarEvent saved = calendarEventRepository.save(event);
        auditLogService.log(gym, owner, "CALENDAR_EVENT_CREATED", "eventId=" + saved.getId());
        return toView(saved, true);
    }

    @Transactional
    public CalendarEventView createForEmployee(User currentUser, Long gymId, CreateCalendarEventRequest request) {
        Employee employee = requireEmployeeGym(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_SCHEDULE);
        validateEventTimes(request.startAt(), request.endAt());
        CalendarEvent event = buildEvent(employee.getGym(), currentUser, request);
        CalendarEvent saved = calendarEventRepository.save(event);
        auditLogService.log(employee.getGym(), currentUser, "CALENDAR_EVENT_CREATED", "eventId=" + saved.getId());
        return toView(saved, true);
    }

    @Transactional
    public CalendarEventView updateForOwner(Long ownerUserId, Long gymId, Long eventId, UpdateCalendarEventRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        CalendarEvent event = requireEvent(gymId, eventId);
        validateEventTimes(request.startAt(), request.endAt());
        applyUpdate(event, request);
        CalendarEvent saved = calendarEventRepository.save(event);
        auditLogService.log(gym, gym.getOwnerUser(), "CALENDAR_EVENT_UPDATED", "eventId=" + saved.getId());
        return toView(saved, true);
    }

    @Transactional
    public CalendarEventView updateForEmployee(User currentUser, Long gymId, Long eventId, UpdateCalendarEventRequest request) {
        Employee employee = requireEmployeeGym(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_SCHEDULE);
        CalendarEvent event = requireEvent(gymId, eventId);
        if (!event.getCreatedByUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nie masz uprawnień do edycji tego wpisu w terminarzu.");
        }
        validateEventTimes(request.startAt(), request.endAt());
        applyUpdate(event, request);
        CalendarEvent saved = calendarEventRepository.save(event);
        auditLogService.log(employee.getGym(), currentUser, "CALENDAR_EVENT_UPDATED", "eventId=" + saved.getId());
        return toView(saved, true);
    }

    @Transactional
    public void deleteForOwner(Long ownerUserId, Long gymId, Long eventId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        CalendarEvent event = requireEvent(gymId, eventId);
        calendarEventRepository.delete(event);
        auditLogService.log(gym, gym.getOwnerUser(), "CALENDAR_EVENT_DELETED", "eventId=" + eventId);
    }

    @Transactional
    public void deleteForEmployee(User currentUser, Long gymId, Long eventId) {
        Employee employee = requireEmployeeGym(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_SCHEDULE);
        CalendarEvent event = requireEvent(gymId, eventId);
        if (!event.getCreatedByUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nie masz uprawnień do usunięcia tego wpisu w terminarzu.");
        }
        calendarEventRepository.delete(event);
        auditLogService.log(employee.getGym(), currentUser, "CALENDAR_EVENT_DELETED", "eventId=" + eventId);
    }

    private Gym requireOwnerGym(Long ownerUserId, Long gymId) {
        return gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }

    private Employee requireEmployeeGym(User currentUser, Long gymId) {
        return employeeRepository.findByUserId(currentUser.getId())
                .filter(e -> e.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie masz uprawnień do tej siłowni."));
    }

    private CalendarEvent requireEvent(Long gymId, Long eventId) {
        return calendarEventRepository.findByIdAndGymId(eventId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono wpisu w terminarzu."));
    }

    private void validateRange(java.time.LocalDateTime from, java.time.LocalDateTime to) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw new IllegalArgumentException("Nieprawidłowy zakres dat w terminarzu.");
        }
    }

    private void validateEventTimes(java.time.LocalDateTime startAt, java.time.LocalDateTime endAt) {
        if (startAt == null || endAt == null || !endAt.isAfter(startAt)) {
            throw new IllegalArgumentException("Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia.");
        }
    }

    private CalendarEvent buildEvent(Gym gym, User creator, CreateCalendarEventRequest request) {
        CalendarEvent event = new CalendarEvent();
        event.setGym(gym);
        event.setCreatedByUser(creator);
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        event.setColor(request.color());
        return event;
    }

    private void applyUpdate(CalendarEvent event, UpdateCalendarEventRequest request) {
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        event.setColor(request.color());
    }

    private CalendarEventView toView(CalendarEvent event, boolean canEdit) {
        return new CalendarEventView(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getStartAt(),
                event.getEndAt(),
                event.getColor(),
                event.getCreatedByUser().getId(),
                event.getCreatedByUser().getEmail(),
                canEdit
        );
    }
}

package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateWorkScheduleEntryRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateWorkScheduleEntryRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.WorkScheduleEntryView;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.domain.WorkScheduleEntry;
import com.jagorczyk.gymManagement.domain.WorkScheduleEntryType;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.WorkScheduleEntryRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkScheduleService {
    private final WorkScheduleEntryRepository workScheduleEntryRepository;
    private final GymRepository gymRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeePermissionService employeePermissionService;
    private final AuditLogService auditLogService;

    public WorkScheduleService(
            WorkScheduleEntryRepository workScheduleEntryRepository,
            GymRepository gymRepository,
            EmployeeRepository employeeRepository,
            EmployeePermissionService employeePermissionService,
            AuditLogService auditLogService
    ) {
        this.workScheduleEntryRepository = workScheduleEntryRepository;
        this.gymRepository = gymRepository;
        this.employeeRepository = employeeRepository;
        this.employeePermissionService = employeePermissionService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<WorkScheduleEntryView> listForOwner(
            Long ownerUserId,
            Long gymId,
            LocalDateTime from,
            LocalDateTime to,
            Long employeeId
    ) {
        requireOwnerGym(ownerUserId, gymId);
        validateRange(from, to);
        return queryEntries(gymId, from, to, employeeId).stream()
                .map(entry -> toView(entry, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WorkScheduleEntryView> listForEmployee(
            User currentUser,
            Long gymId,
            LocalDateTime from,
            LocalDateTime to,
            Long employeeId
    ) {
        Employee currentEmployee = requireEmployeeGym(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_WORK_SCHEDULE);
        validateRange(from, to);
        return queryEntries(gymId, from, to, employeeId).stream()
                .map(entry -> toView(entry, canEmployeeEdit(currentEmployee, entry)))
                .toList();
    }

    @Transactional
    public WorkScheduleEntryView createForOwner(Long ownerUserId, Long gymId, CreateWorkScheduleEntryRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        Employee employee = requireEmployeeInGym(gymId, request.employeeId());
        validateEntryTimes(request.startAt(), request.endAt());
        WorkScheduleEntry entry = buildEntry(gym, employee, gym.getOwnerUser(), request);
        WorkScheduleEntry saved = workScheduleEntryRepository.save(entry);
        auditLogService.log(gym, gym.getOwnerUser(), "WORK_SCHEDULE_CREATED", "entryId=" + saved.getId());
        return toView(saved, true);
    }

    @Transactional
    public WorkScheduleEntryView createForEmployee(User currentUser, Long gymId, CreateWorkScheduleEntryRequest request) {
        Employee currentEmployee = requireEmployeeGym(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_WORK_SCHEDULE);
        if (!request.employeeId().equals(currentEmployee.getId())) {
            throw new IllegalArgumentException("Możesz dodawać wpisy grafiku tylko dla siebie.");
        }
        validateEntryTimes(request.startAt(), request.endAt());
        WorkScheduleEntry entry = buildEntry(currentEmployee.getGym(), currentEmployee, currentUser, request);
        WorkScheduleEntry saved = workScheduleEntryRepository.save(entry);
        auditLogService.log(currentEmployee.getGym(), currentUser, "WORK_SCHEDULE_CREATED", "entryId=" + saved.getId());
        return toView(saved, true);
    }

    @Transactional
    public WorkScheduleEntryView updateForOwner(
            Long ownerUserId,
            Long gymId,
            Long entryId,
            UpdateWorkScheduleEntryRequest request
    ) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        WorkScheduleEntry entry = requireEntry(gymId, entryId);
        Employee employee = requireEmployeeInGym(gymId, request.employeeId());
        validateEntryTimes(request.startAt(), request.endAt());
        applyUpdate(entry, employee, request);
        WorkScheduleEntry saved = workScheduleEntryRepository.save(entry);
        auditLogService.log(gym, gym.getOwnerUser(), "WORK_SCHEDULE_UPDATED", "entryId=" + saved.getId());
        return toView(saved, true);
    }

    @Transactional
    public WorkScheduleEntryView updateForEmployee(
            User currentUser,
            Long gymId,
            Long entryId,
            UpdateWorkScheduleEntryRequest request
    ) {
        Employee currentEmployee = requireEmployeeGym(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_WORK_SCHEDULE);
        WorkScheduleEntry entry = requireEntry(gymId, entryId);
        if (!canEmployeeEdit(currentEmployee, entry)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nie masz uprawnień do edycji tego wpisu w grafiku.");
        }
        if (!request.employeeId().equals(currentEmployee.getId())) {
            throw new IllegalArgumentException("Możesz edytować wpisy grafiku tylko dla siebie.");
        }
        validateEntryTimes(request.startAt(), request.endAt());
        applyUpdate(entry, currentEmployee, request);
        WorkScheduleEntry saved = workScheduleEntryRepository.save(entry);
        auditLogService.log(currentEmployee.getGym(), currentUser, "WORK_SCHEDULE_UPDATED", "entryId=" + saved.getId());
        return toView(saved, true);
    }

    @Transactional
    public void deleteForOwner(Long ownerUserId, Long gymId, Long entryId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        WorkScheduleEntry entry = requireEntry(gymId, entryId);
        workScheduleEntryRepository.delete(entry);
        auditLogService.log(gym, gym.getOwnerUser(), "WORK_SCHEDULE_DELETED", "entryId=" + entryId);
    }

    @Transactional
    public void deleteForEmployee(User currentUser, Long gymId, Long entryId) {
        Employee currentEmployee = requireEmployeeGym(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_WORK_SCHEDULE);
        WorkScheduleEntry entry = requireEntry(gymId, entryId);
        if (!canEmployeeEdit(currentEmployee, entry)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nie masz uprawnień do usunięcia tego wpisu w grafiku.");
        }
        workScheduleEntryRepository.delete(entry);
        auditLogService.log(currentEmployee.getGym(), currentUser, "WORK_SCHEDULE_DELETED", "entryId=" + entryId);
    }

    private List<WorkScheduleEntry> queryEntries(
            Long gymId,
            LocalDateTime from,
            LocalDateTime to,
            Long employeeId
    ) {
        if (employeeId != null) {
            return workScheduleEntryRepository.findByGymIdAndEmployeeIdAndStartAtBeforeAndEndAtAfter(
                    gymId, employeeId, to, from);
        }
        return workScheduleEntryRepository.findByGymIdAndStartAtBeforeAndEndAtAfter(gymId, to, from);
    }

    private boolean canEmployeeEdit(Employee currentEmployee, WorkScheduleEntry entry) {
        return entry.getEmployee().getId().equals(currentEmployee.getId());
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

    private Employee requireEmployeeInGym(Long gymId, Long employeeId) {
        return employeeRepository.findByIdAndGymId(employeeId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono pracownika w tej siłowni."));
    }

    private WorkScheduleEntry requireEntry(Long gymId, Long entryId) {
        return workScheduleEntryRepository.findByIdAndGymId(entryId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono wpisu w grafiku pracy."));
    }

    private void validateRange(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw new IllegalArgumentException("Nieprawidłowy zakres dat w grafiku pracy.");
        }
    }

    private void validateEntryTimes(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null || endAt == null || !endAt.isAfter(startAt)) {
            throw new IllegalArgumentException("Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia.");
        }
    }

    private WorkScheduleEntry buildEntry(
            Gym gym,
            Employee employee,
            User creator,
            CreateWorkScheduleEntryRequest request
    ) {
        WorkScheduleEntry entry = new WorkScheduleEntry();
        entry.setGym(gym);
        entry.setEmployee(employee);
        entry.setEntryType(request.entryType());
        entry.setTitle(resolveTitle(request.entryType(), request.title()));
        entry.setNote(request.note());
        entry.setStartAt(request.startAt());
        entry.setEndAt(request.endAt());
        entry.setCreatedByUser(creator);
        return entry;
    }

    private void applyUpdate(WorkScheduleEntry entry, Employee employee, UpdateWorkScheduleEntryRequest request) {
        entry.setEmployee(employee);
        entry.setEntryType(request.entryType());
        entry.setTitle(resolveTitle(request.entryType(), request.title()));
        entry.setNote(request.note());
        entry.setStartAt(request.startAt());
        entry.setEndAt(request.endAt());
    }

    private String resolveTitle(WorkScheduleEntryType type, String title) {
        if (title != null && !title.isBlank()) {
            return title.trim();
        }
        return type.labelPl();
    }

    private WorkScheduleEntryView toView(WorkScheduleEntry entry, boolean canEdit) {
        User user = entry.getEmployee().getUser();
        String employeeName = user.getEmail();
        return new WorkScheduleEntryView(
                entry.getId(),
                entry.getEmployee().getId(),
                employeeName,
                entry.getEntryType(),
                entry.getTitle(),
                entry.getNote(),
                entry.getStartAt(),
                entry.getEndAt(),
                entry.getEntryType().colorKey(),
                canEdit
        );
    }
}

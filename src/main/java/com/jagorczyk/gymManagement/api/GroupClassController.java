package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.GroupClassDtos.*;
import com.jagorczyk.gymManagement.domain.ClassReservationStatus;
import com.jagorczyk.gymManagement.service.GroupClassService;
import com.jagorczyk.gymManagement.repository.GroupClassRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClassRatingView;
import com.jagorczyk.gymManagement.repository.ClassRatingRepository;

@RestController
@RequestMapping({"/api/owner/gyms/{gymId}/classes", "/api/employee/gyms/{gymId}/classes"})
@Transactional(readOnly = true)
public class GroupClassController {

    private final GroupClassService groupClassService;
    private final GroupClassRepository groupClassRepository;
    private final ClassRatingRepository classRatingRepository;
    private final com.jagorczyk.gymManagement.service.EmployeePermissionService employeePermissionService;
    private final com.jagorczyk.gymManagement.service.CurrentUserService currentUserService;

    public GroupClassController(
            GroupClassService groupClassService,
            GroupClassRepository groupClassRepository,
            ClassRatingRepository classRatingRepository,
            com.jagorczyk.gymManagement.service.EmployeePermissionService employeePermissionService,
            com.jagorczyk.gymManagement.service.CurrentUserService currentUserService
    ) {
        this.groupClassService = groupClassService;
        this.groupClassRepository = groupClassRepository;
        this.classRatingRepository = classRatingRepository;
        this.employeePermissionService = employeePermissionService;
        this.currentUserService = currentUserService;
    }

    private void checkAccess(Long gymId) {
        var user = currentUserService.getCurrentUser();
        if (user.getRole() == com.jagorczyk.gymManagement.domain.Role.OWNER) {
            return;
        }
        if (user.getRole() == com.jagorczyk.gymManagement.domain.Role.EMPLOYEE) {
            if (employeePermissionService.hasPermission(gymId, user.getId(), "MANAGE_CLASSES")) {
                return;
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Brak uprawnień do zarządzania zajęciami."
        );
    }

    @GetMapping
    public List<GroupClassView> getClasses(
            @PathVariable Long gymId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        checkAccess(gymId);
        return groupClassService.getClasses(gymId, from, to).stream()
                .map(c -> new GroupClassView(
                        c.getId(),
                        c.getInstructor().getId(),
                        c.getInstructor().getUser().getEmail(),
                        c.getName(),
                        c.getDescription(),
                        c.getStartTime(),
                        c.getEndTime(),
                        c.getCapacity(),
                        groupClassRepository.countActiveReservations(c.getId()),
                        null
                )).toList();
    }

    @PostMapping
    @Transactional
    public GroupClassView createClass(
            @PathVariable Long gymId,
            @RequestBody CreateGroupClassRequest request
    ) {
        checkAccess(gymId);
        var c = groupClassService.createClass(gymId, request.instructorId(), request.name(), request.description(), request.startTime(), request.endTime(), request.capacity());
        return new GroupClassView(c.getId(), c.getInstructor().getId(), c.getInstructor().getUser().getEmail(), c.getName(), c.getDescription(), c.getStartTime(), c.getEndTime(), c.getCapacity(), 0, null);
    }

    @PutMapping("/{classId}")
    @Transactional
    public GroupClassView updateClass(
            @PathVariable Long gymId,
            @PathVariable Long classId,
            @RequestBody UpdateGroupClassRequest request
    ) {
        checkAccess(gymId);
        var c = groupClassService.updateClass(gymId, classId, request.instructorId(), request.name(), request.description(), request.startTime(), request.endTime(), request.capacity());
        return new GroupClassView(c.getId(), c.getInstructor().getId(), c.getInstructor().getUser().getEmail(), c.getName(), c.getDescription(), c.getStartTime(), c.getEndTime(), c.getCapacity(), groupClassRepository.countActiveReservations(c.getId()), null);
    }

    @DeleteMapping("/{classId}")
    @Transactional
    public void deleteClass(
            @PathVariable Long gymId,
            @PathVariable Long classId
    ) {
        checkAccess(gymId);
        groupClassService.deleteClass(gymId, classId);
    }

    @GetMapping("/{classId}/reservations")
    public List<ClassReservationView> getClassReservations(
            @PathVariable Long gymId,
            @PathVariable Long classId
    ) {
        checkAccess(gymId);
        return groupClassService.getClassReservations(gymId, classId).stream()
                .map(r -> new ClassReservationView(
                        r.getId(),
                        r.getGroupClass().getId(),
                        r.getGuest().getId(),
                        r.getGuest().getFirstName(),
                        r.getGuest().getLastName(),
                        r.getGuest().getEmail(),
                        r.getStatus().name(),
                        r.getReservedAt()
                )).toList();
    }

    @PostMapping("/{classId}/reservations/{reservationId}/attendance")
    @Transactional
    public ClassReservationView updateAttendance(
            @PathVariable Long gymId,
            @PathVariable Long classId,
            @PathVariable Long reservationId,
            @RequestBody UpdateAttendanceRequest request
    ) {
        checkAccess(gymId);
        var r = groupClassService.updateAttendance(gymId, classId, reservationId, ClassReservationStatus.valueOf(request.status()));
        return new ClassReservationView(
                r.getId(),
                r.getGroupClass().getId(),
                r.getGuest().getId(),
                r.getGuest().getFirstName(),
                r.getGuest().getLastName(),
                r.getGuest().getEmail(),
                r.getStatus().name(),
                r.getReservedAt()
        );
    }

    @GetMapping("/ratings")
    public List<ClassRatingView> getGymClassRatings(
            @PathVariable Long gymId
    ) {
        checkAccess(gymId);
        return classRatingRepository.findByGroupClassGymId(gymId).stream()
                .map(r -> new ClassRatingView(
                        r.getId(),
                        r.getGroupClass().getId(),
                        r.getGroupClass().getName(),
                        r.getGuest().getFirstName() + " " + r.getGuest().getLastName(),
                        r.getRating(),
                        r.getComment(),
                        r.getCreatedAt()
                )).toList();
    }
}

package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.GroupClassDtos.*;
import com.jagorczyk.gymManagement.domain.ClassReservationStatus;
import com.jagorczyk.gymManagement.service.GroupClassService;
import com.jagorczyk.gymManagement.repository.GroupClassRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/api/owner/gyms/{gymId}/classes", "/api/employee/gyms/{gymId}/classes"})
public class GroupClassController {

    private final GroupClassService groupClassService;
    private final GroupClassRepository groupClassRepository;

    public GroupClassController(GroupClassService groupClassService, GroupClassRepository groupClassRepository) {
        this.groupClassService = groupClassService;
        this.groupClassRepository = groupClassRepository;
    }

    @GetMapping
    @PreAuthorize("@employeePermissionService.hasPermission(#gymId, principal.id, 'MANAGE_CLASSES') or hasRole('OWNER')")
    public List<GroupClassView> getClasses(
            @PathVariable Long gymId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
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
                        groupClassRepository.countActiveReservations(c.getId())
                )).toList();
    }

    @PostMapping
    @PreAuthorize("@employeePermissionService.hasPermission(#gymId, principal.id, 'MANAGE_CLASSES') or hasRole('OWNER')")
    public GroupClassView createClass(
            @PathVariable Long gymId,
            @RequestBody CreateGroupClassRequest request
    ) {
        var c = groupClassService.createClass(gymId, request.instructorId(), request.name(), request.description(), request.startTime(), request.endTime(), request.capacity());
        return new GroupClassView(c.getId(), c.getInstructor().getId(), c.getInstructor().getUser().getEmail(), c.getName(), c.getDescription(), c.getStartTime(), c.getEndTime(), c.getCapacity(), 0);
    }

    @PutMapping("/{classId}")
    @PreAuthorize("@employeePermissionService.hasPermission(#gymId, principal.id, 'MANAGE_CLASSES') or hasRole('OWNER')")
    public GroupClassView updateClass(
            @PathVariable Long gymId,
            @PathVariable Long classId,
            @RequestBody UpdateGroupClassRequest request
    ) {
        var c = groupClassService.updateClass(gymId, classId, request.instructorId(), request.name(), request.description(), request.startTime(), request.endTime(), request.capacity());
        return new GroupClassView(c.getId(), c.getInstructor().getId(), c.getInstructor().getUser().getEmail(), c.getName(), c.getDescription(), c.getStartTime(), c.getEndTime(), c.getCapacity(), groupClassRepository.countActiveReservations(c.getId()));
    }

    @DeleteMapping("/{classId}")
    @PreAuthorize("@employeePermissionService.hasPermission(#gymId, principal.id, 'MANAGE_CLASSES') or hasRole('OWNER')")
    public void deleteClass(
            @PathVariable Long gymId,
            @PathVariable Long classId
    ) {
        groupClassService.deleteClass(gymId, classId);
    }

    @GetMapping("/{classId}/reservations")
    @PreAuthorize("@employeePermissionService.hasPermission(#gymId, principal.id, 'MANAGE_CLASSES') or hasRole('OWNER')")
    public List<ClassReservationView> getClassReservations(
            @PathVariable Long gymId,
            @PathVariable Long classId
    ) {
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
    @PreAuthorize("@employeePermissionService.hasPermission(#gymId, principal.id, 'MANAGE_CLASSES') or hasRole('OWNER')")
    public ClassReservationView updateAttendance(
            @PathVariable Long gymId,
            @PathVariable Long classId,
            @PathVariable Long reservationId,
            @RequestBody UpdateAttendanceRequest request
    ) {
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
}

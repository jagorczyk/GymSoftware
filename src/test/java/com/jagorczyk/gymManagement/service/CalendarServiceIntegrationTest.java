package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateCalendarEventRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateCalendarEventRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.EnumSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class CalendarServiceIntegrationTest {
    @Autowired
    CalendarService calendarService;
    @Autowired
    UserRepository userRepository;
    @Autowired
    GymRepository gymRepository;
    @Autowired
    EmployeeRepository employeeRepository;
    @Autowired
    PasswordEncoder passwordEncoder;

    @Test
    void ownerCanEditAnyEventEmployeeOnlyOwn() {
        User owner = saveUser("owner-cal@test.com", Role.OWNER);
        User employeeUser = saveUser("employee-cal@test.com", Role.EMPLOYEE);

        Gym gym = new Gym();
        gym.setName("Cal Gym");
        gym.setAddress("Addr");
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);
        final long gymId = gym.getId();

        Employee employee = new Employee();
        employee.setGym(gym);
        employee.setUser(employeeUser);
        employee.setPermissions(EnumSet.copyOf(EmployeePermission.defaultPermissions()));
        employee.getPermissions().add(EmployeePermission.MANAGE_SCHEDULE);
        employeeRepository.save(employee);

        LocalDateTime start = LocalDateTime.of(2026, 6, 3, 10, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 3, 11, 0);

        var ownerEvent = calendarService.createForOwner(
                owner.getId(),
                gymId,
                new CreateCalendarEventRequest("Owner wpis", null, start, end, "blue")
        );
        var employeeEvent = calendarService.createForEmployee(
                employeeUser,
                gymId,
                new CreateCalendarEventRequest("Employee wpis", null, start.plusHours(2), end.plusHours(2), "emerald")
        );
        final long ownerEventId = ownerEvent.id();
        final long employeeEventId = employeeEvent.id();

        var employeeView = calendarService.listForEmployee(
                employeeUser,
                gymId,
                start.minusDays(1),
                end.plusDays(1)
        );
        assertThat(employeeView).hasSize(2);
        assertThat(employeeView.stream().filter(v -> v.id().equals(ownerEventId)).findFirst().orElseThrow().canEdit())
                .isFalse();
        assertThat(employeeView.stream().filter(v -> v.id().equals(employeeEventId)).findFirst().orElseThrow().canEdit())
                .isTrue();

        assertThatThrownBy(() -> calendarService.updateForEmployee(
                employeeUser,
                gymId,
                ownerEventId,
                new UpdateCalendarEventRequest("Hack", null, start, end, "blue")
        )).isInstanceOf(ResponseStatusException.class);

        calendarService.updateForOwner(
                owner.getId(),
                gymId,
                employeeEventId,
                new UpdateCalendarEventRequest("Owner edit", null, start.plusHours(3), end.plusHours(3), "amber")
        );

        calendarService.deleteForOwner(owner.getId(), gymId, ownerEventId);
        calendarService.deleteForEmployee(employeeUser, gymId, employeeEventId);

        assertThat(calendarService.listForOwner(owner.getId(), gymId, start.minusDays(1), end.plusDays(1)))
                .isEmpty();
    }

    private User saveUser(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(role);
        return userRepository.save(user);
    }
}

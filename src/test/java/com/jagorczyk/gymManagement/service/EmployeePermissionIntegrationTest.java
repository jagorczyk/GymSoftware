package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateEmployeeRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import java.util.EnumSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class EmployeePermissionIntegrationTest {
    @Autowired
    OwnerService ownerService;
    @Autowired
    EmployeeService employeeService;
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
    void ownerCanGrantSchedulePermissionAndEmployeeWithoutItIsBlocked() {
        User owner = saveUser("owner-perm@test.com", Role.OWNER);
        Gym gym = new Gym();
        gym.setName("Perm Gym");
        gym.setAddress("Addr");
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);
        final long gymId = gym.getId();

        var created = ownerService.createEmployee(
                owner.getId(),
                gymId,
                new CreateEmployeeRequest("employee-perm@test.com", "secret123", null, null, EnumSet.of(EmployeePermission.MANAGE_SCHEDULE), null, null)
        );
        assertThat(created.permissions()).contains(
                "VIEW_DASHBOARD",
                "MANAGE_GUESTS",
                "SELL_PASSES",
                "MANAGE_LOCKERS",
                "MANAGE_SCHEDULE"
        );

        User employeeUser = userRepository.findByEmail("employee-perm@test.com").orElseThrow();

        calendarService.listForEmployee(
                employeeUser,
                gymId,
                java.time.LocalDateTime.now().minusDays(1),
                java.time.LocalDateTime.now().plusDays(1)
        );

        Employee employee = employeeRepository.findById(created.id()).orElseThrow();
        employee.getPermissions().remove(EmployeePermission.MANAGE_SCHEDULE);
        employeeRepository.save(employee);

        assertThatThrownBy(() -> calendarService.listForEmployee(
                employeeUser,
                gymId,
                java.time.LocalDateTime.now().minusDays(1),
                java.time.LocalDateTime.now().plusDays(1)
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Zarządzanie terminarzem");
    }

    @Test
    void employeeCanCreateLockerAndPassTypeWithGrantedPermissions() {
        User owner = saveUser("owner-extra-perm@test.com", Role.OWNER);
        Gym gym = new Gym();
        gym.setName("Extra Perm Gym");
        gym.setAddress("Addr");
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);
        final long gymId = gym.getId();

        var created = ownerService.createEmployee(
                owner.getId(),
                gymId,
                new CreateEmployeeRequest(
                        "employee-extra@test.com",
                        "secret123",
                        null,
                        null,
                        EnumSet.of(EmployeePermission.CREATE_LOCKERS, EmployeePermission.MANAGE_PASS_TYPES),
                        null,
                        null
                )
        );
        assertThat(created.permissions()).contains("CREATE_LOCKERS", "MANAGE_PASS_TYPES");

        User employeeUser = userRepository.findByEmail("employee-extra@test.com").orElseThrow();

        var locker = employeeService.createLocker(
                employeeUser,
                gymId,
                new com.jagorczyk.gymManagement.api.dto.GymDtos.CreateLockerRequest("B-12")
        );
        assertThat(locker.lockerNumber()).isEqualTo("B-12");

        var passType = employeeService.createPassType(
                employeeUser,
                gymId,
                new com.jagorczyk.gymManagement.api.dto.GymDtos.CreatePassTypeRequest(
                        "OPEN 30",
                        java.math.BigDecimal.valueOf(199),
                        30,
                        null
                )
        );
        assertThat(passType.name()).isEqualTo("OPEN 30");
    }

    private User saveUser(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(role);
        return userRepository.save(user);
    }
}


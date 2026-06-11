package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateEmployeeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateWorkScheduleEntryRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateWorkScheduleEntryRequest;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.domain.WorkScheduleEntryType;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.EnumSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class WorkScheduleServiceIntegrationTest {
    @Autowired
    OwnerService ownerService;
    @Autowired
    WorkScheduleService workScheduleService;
    @Autowired
    UserRepository userRepository;
    @Autowired
    GymRepository gymRepository;
    @Autowired
    PasswordEncoder passwordEncoder;

    @Test
    void ownerCanCreateVacationForEmployee() {
        User owner = saveUser("owner-ws@test.com", Role.OWNER);
        Gym gym = gymRepository.save(newGym(owner, "Work Schedule Gym"));
        var created = ownerService.createEmployee(
                owner.getId(),
                gym.getId(),
                new CreateEmployeeRequest("employee-ws@test.com", "secret123", EnumSet.noneOf(EmployeePermission.class))
        );

        LocalDateTime start = LocalDateTime.of(2026, 6, 10, 9, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 10, 17, 0);
        var entry = workScheduleService.createForOwner(
                owner.getId(),
                gym.getId(),
                new CreateWorkScheduleEntryRequest(
                        created.id(),
                        WorkScheduleEntryType.VACATION,
                        null,
                        "Urlop wypoczynkowy",
                        start,
                        end
                )
        );

        assertThat(entry.entryType()).isEqualTo(WorkScheduleEntryType.VACATION);
        assertThat(entry.employeeId()).isEqualTo(created.id());
        assertThat(entry.title()).isEqualTo("Urlop");
        assertThat(entry.canEdit()).isTrue();
    }

    @Test
    void employeeWithPermissionCanEditOwnEntryButNotOthers() {
        User owner = saveUser("owner-ws2@test.com", Role.OWNER);
        Gym gym = gymRepository.save(newGym(owner, "Work Schedule Gym 2"));
        var employeeA = ownerService.createEmployee(
                owner.getId(),
                gym.getId(),
                new CreateEmployeeRequest(
                        "employee-ws-a@test.com",
                        "secret123",
                        EnumSet.of(EmployeePermission.MANAGE_WORK_SCHEDULE)
                )
        );
        var employeeB = ownerService.createEmployee(
                owner.getId(),
                gym.getId(),
                new CreateEmployeeRequest("employee-ws-b@test.com", "secret123", EnumSet.noneOf(EmployeePermission.class))
        );

        User userA = userRepository.findByEmail("employee-ws-a@test.com").orElseThrow();
        LocalDateTime start = LocalDateTime.of(2026, 6, 11, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 11, 16, 0);

        var ownEntry = workScheduleService.createForEmployee(
                userA,
                gym.getId(),
                new CreateWorkScheduleEntryRequest(
                        employeeA.id(),
                        WorkScheduleEntryType.VACATION,
                        "Mój urlop",
                        null,
                        start,
                        end
                )
        );

        var updated = workScheduleService.updateForEmployee(
                userA,
                gym.getId(),
                ownEntry.id(),
                new UpdateWorkScheduleEntryRequest(
                        employeeA.id(),
                        WorkScheduleEntryType.VACATION,
                        "Mój urlop zaktualizowany",
                        null,
                        start,
                        end
                )
        );
        assertThat(updated.title()).isEqualTo("Mój urlop zaktualizowany");

        var ownerEntry = workScheduleService.createForOwner(
                owner.getId(),
                gym.getId(),
                new CreateWorkScheduleEntryRequest(
                        employeeB.id(),
                        WorkScheduleEntryType.SHIFT,
                        "Zmiana B",
                        null,
                        start,
                        end
                )
        );

        assertThatThrownBy(() -> workScheduleService.updateForEmployee(
                userA,
                gym.getId(),
                ownerEntry.id(),
                new UpdateWorkScheduleEntryRequest(
                        employeeB.id(),
                        WorkScheduleEntryType.SHIFT,
                        "Próba edycji",
                        null,
                        start,
                        end
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void employeeWithoutPermissionIsBlocked() {
        User owner = saveUser("owner-ws3@test.com", Role.OWNER);
        Gym gym = gymRepository.save(newGym(owner, "Work Schedule Gym 3"));
        ownerService.createEmployee(
                owner.getId(),
                gym.getId(),
                new CreateEmployeeRequest("employee-ws-no@test.com", "secret123", EnumSet.noneOf(EmployeePermission.class))
        );
        User user = userRepository.findByEmail("employee-ws-no@test.com").orElseThrow();

        LocalDateTime from = LocalDateTime.of(2026, 6, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2026, 6, 30, 23, 59);

        assertThatThrownBy(() -> workScheduleService.listForEmployee(user, gym.getId(), from, to, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("grafikiem pracy");
    }

    private User saveUser(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(role);
        return userRepository.save(user);
    }

    private Gym newGym(User owner, String name) {
        Gym gym = new Gym();
        gym.setName(name);
        gym.setAddress("Addr");
        gym.setOwnerUser(owner);
        return gym;
    }
}

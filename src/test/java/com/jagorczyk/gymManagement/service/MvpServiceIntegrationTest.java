package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.RegisterRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.AssignLockerRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.SellPassRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.Locker;
import com.jagorczyk.gymManagement.domain.LockerStatus;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.AuditLogRepository;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.LockerAssignmentRepository;
import com.jagorczyk.gymManagement.repository.LockerRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class MvpServiceIntegrationTest {
    @Autowired
    AuthService authService;
    @Autowired
    EmployeeService employeeService;
    @Autowired
    GymPassRepository gymPassRepository;
    @Autowired
    LockerAssignmentRepository lockerAssignmentRepository;
    @Autowired
    AuditLogRepository auditLogRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    GymRepository gymRepository;
    @Autowired
    EmployeeRepository employeeRepository;
    @Autowired
    GuestRepository guestRepository;
    @Autowired
    LockerRepository lockerRepository;
    @Autowired
    PasswordEncoder passwordEncoder;

    @Test
    void registerGeneratesJwtTokenAfterVerification() {
        var response = authService.register(new RegisterRequest("owner@test.com", "secret123", Role.OWNER));
        assertThat(response.token()).isNull();
        User user = userRepository.findByEmail("owner@test.com").get();
        var verifyResponse = authService.verifyEmail(new com.jagorczyk.gymManagement.api.dto.AuthDtos.VerifyEmailRequest("owner@test.com", user.getVerificationCode(), null));
        assertThat(verifyResponse.token()).isNull();
        assertThat(verifyResponse.mfaSetupRequired()).isTrue();
        assertThat(verifyResponse.mfaToken()).isNotBlank();
    }

    @Test
    void employeeCanSellPassAndAssignLockerAndGenerateAuditLogs() {
        User owner = user("owner2@test.com", Role.OWNER);
        owner = userRepository.save(owner);
        User employeeUser = user("employee@test.com", Role.EMPLOYEE);
        employeeUser = userRepository.save(employeeUser);

        Gym gym = new Gym();
        gym.setName("Gym");
        gym.setAddress("Address");
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);

        Employee employee = new Employee();
        employee.setGym(gym);
        employee.setUser(employeeUser);
        employeeRepository.save(employee);

        Guest guest = new Guest();
        guest.setGym(gym);
        guest.setFirstName("Jan");
        guest.setLastName("Nowak");
        guest.setEmail("jan@test.com");
        guest = guestRepository.save(guest);

        Locker locker = new Locker();
        locker.setGym(gym);
        locker.setLockerNumber("A-1");
        locker.setStatus(LockerStatus.AVAILABLE);
        locker = lockerRepository.save(locker);

        employeeService.sellPass(
                employeeUser,
                gym.getId(),
                new SellPassRequest(
                        guest.getId(),
                        "MONTHLY",
                        LocalDate.now(),
                        LocalDate.now().plusMonths(1),
                        BigDecimal.valueOf(199.99)
                )
        );
        employeeService.assignLocker(
                employeeUser,
                gym.getId(),
                new AssignLockerRequest(locker.getId(), guest.getId())
        );

        assertThat(gymPassRepository.findByGymId(gym.getId())).hasSize(1);
        assertThat(lockerAssignmentRepository.findByLockerGymIdAndReturnedAtIsNull(gym.getId())).hasSize(1);
        assertThat(auditLogRepository.findTop100ByGymIdOrderByCreatedAtDesc(gym.getId())).hasSize(2);
    }

    private User user(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(role);
        return user;
    }
}

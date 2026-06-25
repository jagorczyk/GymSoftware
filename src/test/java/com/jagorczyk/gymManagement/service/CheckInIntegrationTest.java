package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.SellPassRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.domain.PassType;
import com.jagorczyk.gymManagement.repository.PassTypeRepository;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GuestCheckInRepository;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
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
class CheckInIntegrationTest {
    @Autowired EmployeeService employeeService;
    @Autowired UserRepository userRepository;
    @Autowired GymRepository gymRepository;
    @Autowired com.jagorczyk.gymManagement.repository.EmployeeRepository employeeRepository;
    @Autowired GuestRepository guestRepository;
    @Autowired GuestCheckInRepository guestCheckInRepository;
    @Autowired GymPassRepository gymPassRepository;
    @Autowired PassTypeRepository passTypeRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @Test
    void checkInAndCheckOutIndependentOfLocker() {
        User owner = user("owner-ci@test.com", Role.OWNER);
        owner = userRepository.save(owner);
        User employeeUser = user("emp-ci@test.com", Role.EMPLOYEE);
        employeeUser = userRepository.save(employeeUser);

        Gym gym = new Gym();
        gym.setName("Gym CI");
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);

        Employee employee = new Employee();
        employee.setGym(gym);
        employee.setUser(employeeUser);
        employeeRepository.save(employee);

        Guest guest = new Guest();
        guest.setGym(gym);
        guest.setFirstName("Anna");
        guest.setLastName("Test");
        guest = guestRepository.save(guest);

        employeeService.sellPass(
                employeeUser,
                gym.getId(),
                new SellPassRequest(
                        guest.getId(),
                        "MONTHLY",
                        null,
                        LocalDate.now(),
                        LocalDate.now().plusMonths(1),
                        BigDecimal.valueOf(99)));

        employeeService.checkIn(employeeUser, gym.getId(), guest.getId());
        assertThat(guestCheckInRepository.existsByGuestIdAndCheckedOutAtIsNull(guest.getId())).isTrue();

        var overview = employeeService.liveOverview(employeeUser, gym.getId());
        assertThat(overview.presentGuests()).hasSize(1);

        employeeService.checkOut(employeeUser, gym.getId(), guest.getId());
        assertThat(guestCheckInRepository.existsByGuestIdAndCheckedOutAtIsNull(guest.getId())).isFalse();
    }

    @Test
    void checkInConsumesEntryLimitedPass() {
        User owner = user("owner-entry@test.com", Role.OWNER);
        owner = userRepository.save(owner);
        User employeeUser = user("emp-entry@test.com", Role.EMPLOYEE);
        employeeUser = userRepository.save(employeeUser);

        Gym gym = new Gym();
        gym.setName("Gym Entry");
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);

        Employee employee = new Employee();
        employee.setGym(gym);
        employee.setUser(employeeUser);
        employeeRepository.save(employee);

        Guest guest = new Guest();
        guest.setGym(gym);
        guest.setFirstName("Jan");
        guest.setLastName("Wejscie");
        guest = guestRepository.save(guest);

        var passType = new PassType();
        passType.setGym(gym);
        passType.setName("Jedno wejscie");
        passType.setPrice(BigDecimal.valueOf(25));
        passType.setDurationDays(30);
        passType.setMaxEntries(1);
        passType = passTypeRepository.save(passType);

        employeeService.sellPass(
                employeeUser,
                gym.getId(),
                new SellPassRequest(
                        guest.getId(),
                        passType.getName(),
                        passType.getId(),
                        LocalDate.now(),
                        LocalDate.now().plusDays(30),
                        BigDecimal.valueOf(25)));

        GymPass passBefore = gymPassRepository.findByGuestId(guest.getId()).getFirst();
        assertThat(passBefore.getRemainingEntries()).isEqualTo(1);

        employeeService.checkIn(employeeUser, gym.getId(), guest.getId());

        GymPass passAfter = gymPassRepository.findById(passBefore.getId()).orElseThrow();
        assertThat(passAfter.getRemainingEntries()).isZero();
        assertThat(passAfter.getStatus()).isEqualTo(PassStatus.EXPIRED);
    }

    private User user(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(role);
        return user;
    }
}

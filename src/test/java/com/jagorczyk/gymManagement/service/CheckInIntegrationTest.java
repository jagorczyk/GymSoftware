package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.SellPassRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GuestCheckInRepository;
import com.jagorczyk.gymManagement.repository.GuestRepository;
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

    private User user(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(role);
        return user;
    }
}

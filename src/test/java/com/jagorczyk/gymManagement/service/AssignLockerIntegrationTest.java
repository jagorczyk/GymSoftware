package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.AssignLockerRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateEmployeeRequest;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.Locker;
import com.jagorczyk.gymManagement.domain.LockerStatus;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.LockerAssignmentRepository;
import com.jagorczyk.gymManagement.repository.LockerRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import java.util.EnumSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class AssignLockerIntegrationTest {
    @Autowired
    OwnerService ownerService;
    @Autowired
    EmployeeService employeeService;
    @Autowired
    UserRepository userRepository;
    @Autowired
    GymRepository gymRepository;
    @Autowired
    GuestRepository guestRepository;
    @Autowired
    LockerRepository lockerRepository;
    @Autowired
    LockerAssignmentRepository lockerAssignmentRepository;
    @Autowired
    org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Test
    void assignLockerMarksLockerOccupiedAndBlocksDuplicateGuestAssignment() {
        User owner = saveUser("owner-assign@test.com", Role.OWNER);
        Gym gym = gymRepository.save(newGym(owner, "Assign Gym"));
        ownerService.createEmployee(
                owner.getId(),
                gym.getId(),
                new CreateEmployeeRequest("employee-assign@test.com", "secret123", EnumSet.noneOf(EmployeePermission.class), null, null)
        );
        User employeeUser = userRepository.findByEmail("employee-assign@test.com").orElseThrow();

        Guest guestEntity = new Guest();
        guestEntity.setGym(gym);
        guestEntity.setFirstName("Anna");
        guestEntity.setLastName("Kowalska");
        guestEntity.setEmail("anna@test.com");
        final Guest guest = guestRepository.save(guestEntity);

        Locker locker = new Locker();
        locker.setGym(gym);
        locker.setLockerNumber("C-1");
        locker.setStatus(LockerStatus.AVAILABLE);
        locker = lockerRepository.save(locker);

        employeeService.assignLocker(
                employeeUser,
                gym.getId(),
                new AssignLockerRequest(locker.getId(), guest.getId())
        );

        Locker updated = lockerRepository.findById(locker.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(LockerStatus.OCCUPIED);
        assertThat(lockerAssignmentRepository.findByGuestIdAndReturnedAtIsNull(guest.getId())).hasSize(1);

        Locker secondLocker = new Locker();
        secondLocker.setGym(gym);
        secondLocker.setLockerNumber("C-2");
        secondLocker.setStatus(LockerStatus.AVAILABLE);
        final Locker availableLocker = lockerRepository.save(secondLocker);

        assertThatThrownBy(() -> employeeService.assignLocker(
                employeeUser,
                gym.getId(),
                new AssignLockerRequest(availableLocker.getId(), guest.getId())
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ma już przypisaną szafkę");
    }

    @Test
    void assignLockerRejectsLockerWithActiveAssignmentEvenIfStatusAvailable() {
        User owner = saveUser("owner-assign2@test.com", Role.OWNER);
        Gym gym = gymRepository.save(newGym(owner, "Assign Gym 2"));
        ownerService.createEmployee(
                owner.getId(),
                gym.getId(),
                new CreateEmployeeRequest("employee-assign2@test.com", "secret123", EnumSet.noneOf(EmployeePermission.class), null, null)
        );
        User employeeUser = userRepository.findByEmail("employee-assign2@test.com").orElseThrow();

        Guest guestA = guestRepository.save(guest(gym, "Ala", "Nowak"));
        Guest guestB = guestRepository.save(guest(gym, "Basia", "Nowak"));

        Locker locker = lockerRepository.save(locker(gym, "D-1", LockerStatus.AVAILABLE));
        employeeService.assignLocker(
                employeeUser,
                gym.getId(),
                new AssignLockerRequest(locker.getId(), guestA.getId())
        );

        locker.setStatus(LockerStatus.AVAILABLE);
        lockerRepository.save(locker);

        assertThatThrownBy(() -> employeeService.assignLocker(
                employeeUser,
                gym.getId(),
                new AssignLockerRequest(locker.getId(), guestB.getId())
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("jest już zajęta");
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

    private Guest guest(Gym gym, String firstName, String lastName) {
        Guest guest = new Guest();
        guest.setGym(gym);
        guest.setFirstName(firstName);
        guest.setLastName(lastName);
        guest.setEmail(firstName.toLowerCase() + "@test.com");
        return guest;
    }

    private Locker locker(Gym gym, String number, LockerStatus status) {
        Locker locker = new Locker();
        locker.setGym(gym);
        locker.setLockerNumber(number);
        locker.setStatus(status);
        return locker;
    }
}

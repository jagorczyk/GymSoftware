package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.CreateSupportThreadRequest;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class SupportMessageServiceIntegrationTest {
    @Autowired
    SupportMessageService supportMessageService;
    @Autowired
    UserRepository userRepository;
    @Autowired
    GymRepository gymRepository;
    @Autowired
    GuestRepository guestRepository;

    @Test
    void ownerCanListSupportThreadsAfterClientCreatesOne() {
        User owner = new User();
        owner.setEmail("owner-support@test.com");
        owner.setPasswordHash("hash");
        owner.setRole(Role.OWNER);
        owner.setEmailVerified(true);
        owner = userRepository.save(owner);

        User client = new User();
        client.setEmail("client-support@test.com");
        client.setPasswordHash("hash");
        client.setRole(Role.GUEST);
        client.setEmailVerified(true);
        client = userRepository.save(client);

        Gym gym = new Gym();
        gym.setName("Support Gym");
        gym.setAddress("Addr");
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);
        final long gymId = gym.getId();

        Guest guest = new Guest();
        guest.setGym(gym);
        guest.setUser(client);
        guest.setFirstName("Jan");
        guest.setLastName("Kowalski");
        guest.setEmail(client.getEmail());
        guestRepository.save(guest);

        supportMessageService.createThread(
                client.getId(),
                gymId,
                new CreateSupportThreadRequest("Pytanie o karnet", "Czy mogę przedłużyć karnet?")
        );

        var threads = supportMessageService.listStaffThreads(owner, gymId);
        assertThat(threads).hasSize(1);
        assertThat(threads.get(0).subject()).isEqualTo("Pytanie o karnet");
        assertThat(threads.get(0).unreadCount()).isEqualTo(1);
        assertThat(supportMessageService.getStaffUnreadCount(owner, gymId)).isEqualTo(1);
    }
}

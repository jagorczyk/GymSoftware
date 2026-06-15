package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.PersonalTraining;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.PersonalTrainingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClientPortalServiceTest {

    @Mock
    private GuestRepository guestRepository;

    @Mock
    private PersonalTrainingRepository personalTrainingRepository;

    @InjectMocks
    private ClientPortalService clientPortalService;

    @BeforeEach
    void setUp() {
        clientPortalService.setPersonalTrainingRepository(personalTrainingRepository);
    }

    @Test
    void testCancelPersonalTraining_Success() {
        Long userId = 1L;
        Long gymId = 1L;
        Long trainingId = 100L;

        Guest guest = new Guest();
        guest.setId(10L);

        Gym gym = new Gym();
        gym.setId(gymId);

        PersonalTraining training = new PersonalTraining();
        training.setId(trainingId);
        training.setClient(guest);
        training.setGym(gym);
        training.setStatus("SCHEDULED");

        when(guestRepository.findByUserIdAndGymId(userId, gymId)).thenReturn(Optional.of(guest));
        when(personalTrainingRepository.findById(trainingId)).thenReturn(Optional.of(training));

        clientPortalService.cancelPersonalTraining(userId, gymId, trainingId);

        assertEquals("CANCELLED", training.getStatus());
        verify(personalTrainingRepository, times(1)).save(training);
    }

    @Test
    void testCancelPersonalTraining_NotYourTraining() {
        Long userId = 1L;
        Long gymId = 1L;
        Long trainingId = 100L;

        Guest guest = new Guest();
        guest.setId(10L);

        Guest otherGuest = new Guest();
        otherGuest.setId(20L);

        Gym gym = new Gym();
        gym.setId(gymId);

        PersonalTraining training = new PersonalTraining();
        training.setId(trainingId);
        training.setClient(otherGuest);
        training.setGym(gym);
        training.setStatus("SCHEDULED");

        when(guestRepository.findByUserIdAndGymId(userId, gymId)).thenReturn(Optional.of(guest));
        when(personalTrainingRepository.findById(trainingId)).thenReturn(Optional.of(training));

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            clientPortalService.cancelPersonalTraining(userId, gymId, trainingId);
        });

        assertEquals("Nie możesz anulować treningu, który nie należy do ciebie", exception.getMessage());
        verify(personalTrainingRepository, never()).save(any());
    }

    @Test
    void testCancelPersonalTraining_AlreadyCancelled() {
        Long userId = 1L;
        Long gymId = 1L;
        Long trainingId = 100L;

        Guest guest = new Guest();
        guest.setId(10L);

        Gym gym = new Gym();
        gym.setId(gymId);

        PersonalTraining training = new PersonalTraining();
        training.setId(trainingId);
        training.setClient(guest);
        training.setGym(gym);
        training.setStatus("CANCELLED");

        when(guestRepository.findByUserIdAndGymId(userId, gymId)).thenReturn(Optional.of(guest));
        when(personalTrainingRepository.findById(trainingId)).thenReturn(Optional.of(training));

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            clientPortalService.cancelPersonalTraining(userId, gymId, trainingId);
        });

        assertEquals("Trening jest już anulowany", exception.getMessage());
        verify(personalTrainingRepository, never()).save(any());
    }
}

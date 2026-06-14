package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.TrainerDtos.MyTrainerProfileView;
import com.jagorczyk.gymManagement.api.dto.TrainerDtos.TrainerAvailabilityView;
import com.jagorczyk.gymManagement.api.dto.TrainerDtos.UpdateTrainerProfileRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.PersonalTrainerProfile;
import com.jagorczyk.gymManagement.domain.TrainerAvailability;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import com.jagorczyk.gymManagement.repository.PersonalTrainerProfileRepository;
import com.jagorczyk.gymManagement.repository.TrainerAvailabilityRepository;
import com.jagorczyk.gymManagement.repository.PersonalTrainingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TrainerService {

    private final EmployeeRepository employeeRepository;
    private final PersonalTrainerProfileRepository profileRepository;
    private final TrainerAvailabilityRepository availabilityRepository;
    private final PersonalTrainingRepository trainingRepository;

    public TrainerService(
            EmployeeRepository employeeRepository,
            PersonalTrainerProfileRepository profileRepository,
            TrainerAvailabilityRepository availabilityRepository,
            PersonalTrainingRepository trainingRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.profileRepository = profileRepository;
        this.availabilityRepository = availabilityRepository;
        this.trainingRepository = trainingRepository;
    }

    @Transactional(readOnly = true)
    public MyTrainerProfileView getMyProfile(Long employeeUserId, Long gymId) {
        PersonalTrainerProfile profile = requireTrainerProfile(employeeUserId, gymId);
        List<TrainerAvailabilityView> availabilities = profile.getAvailabilities().stream()
                .map(a -> new TrainerAvailabilityView(a.getId(), a.getDate(), a.getStartTime(), a.getEndTime(), a.getSlotDurationMinutes()))
                .sorted(java.util.Comparator.comparing(TrainerAvailabilityView::date))
                .toList();
        return new MyTrainerProfileView(
                profile.getId(),
                profile.getBio(),
                profile.getSpecialization(),
                profile.getHourlyRate(),
                availabilities
        );
    }

    @Transactional
    public MyTrainerProfileView updateMyProfile(Long employeeUserId, Long gymId, UpdateTrainerProfileRequest request) {
        PersonalTrainerProfile profile = requireTrainerProfile(employeeUserId, gymId);
        profile.setBio(request.bio());
        profile.setSpecialization(request.specialization());
        profile.setHourlyRate(request.hourlyRate());

        // Replace all availabilities
        profile.getAvailabilities().clear();
        if (request.availabilities() != null) {
            for (var req : request.availabilities()) {
                TrainerAvailability a = new TrainerAvailability();
                a.setTrainerProfile(profile);
                a.setDate(req.date());
                a.setStartTime(req.startTime());
                a.setEndTime(req.endTime());
                a.setSlotDurationMinutes(req.slotDurationMinutes() != null ? req.slotDurationMinutes() : 60);
                profile.getAvailabilities().add(a);
            }
        }

        profile = profileRepository.save(profile);

        List<TrainerAvailabilityView> availabilities = profile.getAvailabilities().stream()
                .map(a -> new TrainerAvailabilityView(a.getId(), a.getDate(), a.getStartTime(), a.getEndTime(), a.getSlotDurationMinutes()))
                .sorted(java.util.Comparator.comparing(TrainerAvailabilityView::date))
                .toList();

        return new MyTrainerProfileView(
                profile.getId(),
                profile.getBio(),
                profile.getSpecialization(),
                profile.getHourlyRate(),
                availabilities
        );
    }

    @Transactional(readOnly = true)
    public List<com.jagorczyk.gymManagement.api.dto.TrainerDtos.TrainerTrainingView> getUpcomingTrainings(Long employeeUserId, Long gymId) {
        PersonalTrainerProfile profile = requireTrainerProfile(employeeUserId, gymId);
        LocalDateTime now = LocalDateTime.now();
        return trainingRepository.findAll().stream()
                .filter(t -> t.getTrainer().getId().equals(profile.getEmployee().getId()))
                .filter(t -> t.getScheduledAt().isAfter(now.minusHours(1)))
                .sorted((a, b) -> a.getScheduledAt().compareTo(b.getScheduledAt()))
                .map(t -> new com.jagorczyk.gymManagement.api.dto.TrainerDtos.TrainerTrainingView(
                        t.getId(),
                        t.getClient().getId(),
                        t.getClient().getFirstName(),
                        t.getClient().getLastName(),
                        t.getScheduledAt(),
                        t.getPrice(),
                        t.isPaid(),
                        t.getStatus()
                ))
                .toList();
    }

    @Transactional
    public void cancelTraining(Long employeeUserId, Long gymId, Long trainingId) {
        PersonalTrainerProfile profile = requireTrainerProfile(employeeUserId, gymId);
        com.jagorczyk.gymManagement.domain.PersonalTraining training = trainingRepository.findById(trainingId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono treningu"));
        
        if (!training.getTrainer().getId().equals(profile.getEmployee().getId())) {
            throw new IllegalArgumentException("Brak dostępu do tego treningu");
        }
        
        training.setStatus("CANCELLED");
        trainingRepository.save(training);
    }

    private PersonalTrainerProfile requireTrainerProfile(Long employeeUserId, Long gymId) {
        Employee employee = employeeRepository.findByUserId(employeeUserId)
                .filter(e -> e.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono pracownika."));

        boolean isTrainer = false;
        if (employee.getRank() != null && employee.getRank().getPermissions().contains(EmployeePermission.PERSONAL_TRAINER)) {
            isTrainer = true;
        } else if (employee.getPermissions() != null && employee.getPermissions().contains(EmployeePermission.PERSONAL_TRAINER)) {
            isTrainer = true;
        }

        if (!isTrainer) {
            throw new IllegalArgumentException("Brak uprawnień trenera personalnego.");
        }

        return profileRepository.findByEmployeeId(employee.getId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Profil trenera nie został jeszcze wygenerowany. Poproś właściciela o weryfikację."));
    }
}

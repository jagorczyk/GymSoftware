package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.TrainerAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainerAvailabilityRepository extends JpaRepository<TrainerAvailability, Long> {
    List<TrainerAvailability> findByTrainerProfileId(Long trainerProfileId);
    void deleteByTrainerProfileId(Long trainerProfileId);
}

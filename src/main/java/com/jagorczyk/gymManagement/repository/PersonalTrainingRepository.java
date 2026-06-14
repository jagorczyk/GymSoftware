package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.PersonalTraining;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonalTrainingRepository extends JpaRepository<PersonalTraining, Long> {
    List<PersonalTraining> findByGymId(Long gymId);
    List<PersonalTraining> findByClientId(Long clientId);
    List<PersonalTraining> findByTrainerId(Long trainerId);
}

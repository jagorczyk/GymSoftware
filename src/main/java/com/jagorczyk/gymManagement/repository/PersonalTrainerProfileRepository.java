package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.PersonalTrainerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonalTrainerProfileRepository extends JpaRepository<PersonalTrainerProfile, Long> {
    List<PersonalTrainerProfile> findByGymId(Long gymId);
    List<PersonalTrainerProfile> findByEmployeeId(Long employeeId);
}

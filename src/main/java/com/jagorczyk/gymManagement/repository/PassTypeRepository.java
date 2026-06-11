package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.PassType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PassTypeRepository extends JpaRepository<PassType, Long> {
    List<PassType> findByGymId(Long gymId);
}

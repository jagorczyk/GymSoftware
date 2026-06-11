package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.EmployeeRank;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRankRepository extends JpaRepository<EmployeeRank, Long> {
    List<EmployeeRank> findByGymId(Long gymId);
}

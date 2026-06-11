package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.Employee;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByGymId(Long gymId);

    Optional<Employee> findByUserId(Long userId);

    Optional<Employee> findByIdAndGymId(Long id, Long gymId);

    long countByGymId(Long gymId);
}

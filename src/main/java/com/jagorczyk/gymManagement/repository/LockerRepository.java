package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.Locker;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LockerRepository extends JpaRepository<Locker, Long> {
    List<Locker> findByGymId(Long gymId);

    long countByGymId(Long gymId);
}

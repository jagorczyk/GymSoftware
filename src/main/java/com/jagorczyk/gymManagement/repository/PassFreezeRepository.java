package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.PassFreeze;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PassFreezeRepository extends JpaRepository<PassFreeze, Long> {
    List<PassFreeze> findByGymPassId(Long gymPassId);
    List<PassFreeze> findByProcessedFalseAndEndDateBefore(LocalDate date);
}

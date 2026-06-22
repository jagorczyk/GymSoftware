package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.ScheduledJobRun;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduledJobRunRepository extends JpaRepository<ScheduledJobRun, String> {
}

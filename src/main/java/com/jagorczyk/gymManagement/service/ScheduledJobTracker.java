package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.ScheduledJobRun;
import com.jagorczyk.gymManagement.repository.ScheduledJobRunRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduledJobTracker {
    private final ScheduledJobRunRepository scheduledJobRunRepository;

    public ScheduledJobTracker(ScheduledJobRunRepository scheduledJobRunRepository) {
        this.scheduledJobRunRepository = scheduledJobRunRepository;
    }

    @Transactional
    public void recordSuccess(String jobName, String message) {
        save(jobName, "SUCCESS", message);
    }

    @Transactional
    public void recordFailure(String jobName, String message) {
        save(jobName, "FAILED", message);
    }

    private void save(String jobName, String status, String message) {
        ScheduledJobRun run = scheduledJobRunRepository.findById(jobName).orElseGet(ScheduledJobRun::new);
        run.setJobName(jobName);
        run.setLastRunAt(LocalDateTime.now());
        run.setLastStatus(status);
        run.setLastMessage(message);
        scheduledJobRunRepository.save(run);
    }
}

package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "scheduled_job_runs")
public class ScheduledJobRun {
    @Id
    @Column(name = "job_name", length = 120)
    private String jobName;

    @Column(name = "last_run_at", nullable = false)
    private LocalDateTime lastRunAt;

    @Column(name = "last_status", nullable = false, length = 30)
    private String lastStatus;

    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage;
}

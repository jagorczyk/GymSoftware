package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "gym_notification_settings")
public class GymNotificationSettings {
    @Id
    private Long gymId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gym_id")
    private Gym gym;

    @Column(name = "expiring_pass_email_enabled", nullable = false)
    private boolean expiringPassEmailEnabled;

    @Column(name = "expiring_pass_days_before", nullable = false)
    private int expiringPassDaysBefore = 7;

    @Column(name = "notification_email")
    private String notificationEmail;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}

package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.GymNotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GymNotificationSettingsRepository extends JpaRepository<GymNotificationSettings, Long> {}

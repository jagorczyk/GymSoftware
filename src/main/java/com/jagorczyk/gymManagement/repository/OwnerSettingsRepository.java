package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.OwnerSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OwnerSettingsRepository extends JpaRepository<OwnerSettings, Long> {
}

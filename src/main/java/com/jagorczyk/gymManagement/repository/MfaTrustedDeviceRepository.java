package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.MfaTrustedDevice;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MfaTrustedDeviceRepository extends JpaRepository<MfaTrustedDevice, Long> {
    Optional<MfaTrustedDevice> findByUserIdAndTokenHashAndExpiresAtAfter(
            Long userId,
            String tokenHash,
            LocalDateTime now
    );
}

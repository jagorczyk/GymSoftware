package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.MfaTrustedDevice;
import com.jagorczyk.gymManagement.repository.MfaTrustedDeviceRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrustedMfaDeviceService {
    private final MfaTrustedDeviceRepository repository;
    private final int trustedDeviceDays;

    public TrustedMfaDeviceService(
            MfaTrustedDeviceRepository repository,
            @Value("${app.mfa.trusted-device-days:30}") int trustedDeviceDays
    ) {
        this.repository = repository;
        this.trustedDeviceDays = trustedDeviceDays;
    }

    public boolean isTrusted(Long userId, String rawToken) {
        if (userId == null || rawToken == null || rawToken.isBlank()) {
            return false;
        }
        String hash = hashToken(rawToken);
        return repository.findByUserIdAndTokenHashAndExpiresAtAfter(userId, hash, LocalDateTime.now()).isPresent();
    }

    @Transactional
    public String createTrustedDevice(Long userId, String userAgent) {
        String rawToken = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");

        MfaTrustedDevice device = new MfaTrustedDevice();
        device.setUserId(userId);
        device.setTokenHash(hashToken(rawToken));
        device.setExpiresAt(LocalDateTime.now().plusDays(trustedDeviceDays));
        device.setUserAgent(truncateUserAgent(userAgent));
        repository.save(device);
        return rawToken;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    private String truncateUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return null;
        }
        return userAgent.length() <= 512 ? userAgent : userAgent.substring(0, 512);
    }
}

package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.MfaTrustedDevice;
import com.jagorczyk.gymManagement.repository.MfaTrustedDeviceRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrustedMfaDeviceServiceTest {

    @Mock
    private MfaTrustedDeviceRepository repository;

    private TrustedMfaDeviceService service;

    @BeforeEach
    void setUp() {
        service = new TrustedMfaDeviceService(repository, 30);
    }

    @Test
    void createTrustedDevice_persistsHashedToken() {
        when(repository.save(any(MfaTrustedDevice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String rawToken = service.createTrustedDevice(7L, "Mozilla/5.0");

        assertNotNull(rawToken);
        ArgumentCaptor<MfaTrustedDevice> captor = ArgumentCaptor.forClass(MfaTrustedDevice.class);
        verify(repository).save(captor.capture());
        MfaTrustedDevice saved = captor.getValue();
        assertTrue(saved.getTokenHash().length() == 64);
        assertTrue(saved.getExpiresAt().isAfter(LocalDateTime.now().plusDays(29)));
        assertTrue(saved.getUserAgent().startsWith("Mozilla"));
    }

    @Test
    void isTrusted_returnsTrueForValidToken() {
        String rawToken = "abc123";
        when(repository.findByUserIdAndTokenHashAndExpiresAtAfter(eq(7L), any(), any(LocalDateTime.class)))
                .thenAnswer(invocation -> {
                    String hash = invocation.getArgument(1);
                    MfaTrustedDevice device = new MfaTrustedDevice();
                    device.setTokenHash(hash);
                    return Optional.of(device);
                });

        assertTrue(service.isTrusted(7L, rawToken));
    }

    @Test
    void isTrusted_returnsFalseForMissingToken() {
        assertFalse(service.isTrusted(7L, null));
        assertFalse(service.isTrusted(7L, " "));
    }
}

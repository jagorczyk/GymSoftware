package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.AuthResponse;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.GoogleAuthRequest;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.UserRepository;
import com.jagorczyk.gymManagement.security.GoogleTokenVerifier;
import com.jagorczyk.gymManagement.security.GoogleUserInfo;
import com.jagorczyk.gymManagement.service.MfaService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleAuthServiceTest {

    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MfaService mfaService;

    @InjectMocks
    private GoogleAuthService googleAuthService;

    private final GoogleUserInfo googleUser = new GoogleUserInfo(
            "google-sub-1",
            "user@example.com",
            "Jan",
            "Kowalski",
            "https://example.com/avatar.png",
            true
    );

    @Test
    void loginOrRegister_createsNewGuestWhenRoleProvided() {
        when(googleTokenVerifier.verify("token")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(10L);
            return user;
        });
        when(mfaService.resolveAuthResponse(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            return AuthResponse.withToken("jwt-token");
        });

        AuthResponse response = googleAuthService.loginOrRegister(new GoogleAuthRequest("token", Role.GUEST));

        assertEquals("jwt-token", response.token());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void loginOrRegister_linksExistingAccountByEmail() {
        User existing = new User();
        existing.setId(1L);
        existing.setEmail("user@example.com");
        existing.setPasswordHash("hash");
        existing.setRole(Role.EMPLOYEE);
        existing.setEmailVerified(true);

        when(googleTokenVerifier.verify("token")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        when(mfaService.resolveAuthResponse(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            return AuthResponse.withToken("jwt-token");
        });

        AuthResponse response = googleAuthService.loginOrRegister(new GoogleAuthRequest("token", null));

        assertEquals("jwt-token", response.token());
        assertEquals("google-sub-1", existing.getGoogleId());
        verify(userRepository).save(existing);
    }

    @Test
    void loginOrRegister_rejectsNewEmployeeWithoutAccount() {
        when(googleTokenVerifier.verify("token")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> googleAuthService.loginOrRegister(new GoogleAuthRequest("token", Role.EMPLOYEE))
        );
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginOrRegister_rejectsNewAccountWithoutRole() {
        when(googleTokenVerifier.verify("token")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> googleAuthService.loginOrRegister(new GoogleAuthRequest("token", null))
        );
    }

    @Test
    void loginOrRegister_rejectsConflictingGoogleId() {
        User existing = new User();
        existing.setId(1L);
        existing.setEmail("user@example.com");
        existing.setGoogleId("other-google-id");
        existing.setRole(Role.GUEST);
        existing.setEmailVerified(true);

        when(googleTokenVerifier.verify("token")).thenReturn(googleUser);
        when(userRepository.findByGoogleId("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existing));

        assertThrows(
                IllegalArgumentException.class,
                () -> googleAuthService.loginOrRegister(new GoogleAuthRequest("token", null))
        );
    }
}

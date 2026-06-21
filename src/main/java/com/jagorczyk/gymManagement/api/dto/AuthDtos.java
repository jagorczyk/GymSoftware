package com.jagorczyk.gymManagement.api.dto;

import com.jagorczyk.gymManagement.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotNull Role role
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record VerifyEmailRequest(
            @Email @NotBlank String email,
            @NotBlank String code
    ) {
    }

    public record ResendVerificationRequest(
            @Email @NotBlank String email
    ) {
    }

    public record AuthResponse(
            String token
    ) {
    }

    public record GoogleAuthRequest(
            @NotBlank String idToken,
            Role role
    ) {
    }
}

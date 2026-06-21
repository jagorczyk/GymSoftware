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
            String token,
            boolean mfaRequired,
            boolean mfaSetupRequired,
            String mfaToken
    ) {
        public static AuthResponse withToken(String token) {
            return new AuthResponse(token, false, false, null);
        }

        public static AuthResponse pendingRegistration() {
            return new AuthResponse(null, false, false, null);
        }

        public static AuthResponse mfaChallenge(String mfaToken) {
            return new AuthResponse(null, true, false, mfaToken);
        }

        public static AuthResponse mfaSetup(String mfaToken) {
            return new AuthResponse(null, false, true, mfaToken);
        }
    }

    public record MfaTokenRequest(
            @NotBlank String mfaToken
    ) {
    }

    public record MfaCodeRequest(
            @NotBlank String mfaToken,
            @NotBlank String code
    ) {
    }

    public record MfaSetupResponse(
            String secret,
            String qrCodeDataUrl,
            String otpauthUrl
    ) {
    }

    public record GoogleAuthRequest(
            @NotBlank String idToken,
            Role role
    ) {
    }
}

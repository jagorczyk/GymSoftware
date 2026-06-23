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
            @NotBlank String password,
            String trustedDeviceToken
    ) {
    }

    public record VerifyEmailRequest(
            @Email @NotBlank String email,
            @NotBlank String code,
            String trustedDeviceToken
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
            String mfaToken,
            String trustedDeviceToken
    ) {
        public static AuthResponse withToken(String token) {
            return new AuthResponse(token, false, false, null, null);
        }

        public static AuthResponse withTokenAndTrustedDevice(String token, String trustedDeviceToken) {
            return new AuthResponse(token, false, false, null, trustedDeviceToken);
        }

        public static AuthResponse pendingRegistration() {
            return new AuthResponse(null, false, false, null, null);
        }

        public static AuthResponse mfaChallenge(String mfaToken) {
            return new AuthResponse(null, true, false, mfaToken, null);
        }

        public static AuthResponse mfaSetup(String mfaToken) {
            return new AuthResponse(null, false, true, mfaToken, null);
        }
    }

    public record MfaTokenRequest(
            @NotBlank String mfaToken
    ) {
    }

    public record MfaCodeRequest(
            @NotBlank String mfaToken,
            @NotBlank String code,
            Boolean rememberDevice
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
            Role role,
            String trustedDeviceToken
    ) {
    }
}

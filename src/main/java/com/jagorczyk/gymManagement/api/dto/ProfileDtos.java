package com.jagorczyk.gymManagement.api.dto;

import com.jagorczyk.gymManagement.domain.Role;
import jakarta.validation.constraints.NotBlank;

public final class ProfileDtos {
    private ProfileDtos() {
    }

    public record ProfileView(
            String email,
            String firstName,
            String lastName,
            Role role,
            boolean googleLinked,
            boolean passwordChangeAllowed,
            boolean mfaEnabled,
            boolean mfaMandatory
    ) {
    }

    public record UpdateProfileRequest(
            String firstName,
            String lastName
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank String newPassword
    ) {
    }

    public record MfaProfileConfirmRequest(
            @NotBlank String code
    ) {
    }
}

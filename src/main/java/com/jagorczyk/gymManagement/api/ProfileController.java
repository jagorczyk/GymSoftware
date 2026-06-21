package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.MfaSetupResponse;
import com.jagorczyk.gymManagement.api.dto.ProfileDtos.ChangePasswordRequest;
import com.jagorczyk.gymManagement.api.dto.ProfileDtos.MfaProfileConfirmRequest;
import com.jagorczyk.gymManagement.api.dto.ProfileDtos.ProfileView;
import com.jagorczyk.gymManagement.api.dto.ProfileDtos.UpdateProfileRequest;
import com.jagorczyk.gymManagement.service.CurrentUserService;
import com.jagorczyk.gymManagement.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final CurrentUserService currentUserService;
    private final ProfileService profileService;

    public ProfileController(CurrentUserService currentUserService, ProfileService profileService) {
        this.currentUserService = currentUserService;
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileView getProfile() {
        return profileService.getProfile(currentUserService.getCurrentUser());
    }

    @PutMapping
    public ProfileView updateProfile(@RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(currentUserService.getCurrentUser(), request);
    }

    @PostMapping("/change-password")
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        profileService.changePassword(currentUserService.getCurrentUser(), request);
    }

    @PostMapping("/mfa/setup")
    public MfaSetupResponse beginMfaSetup() {
        return profileService.beginMfaSetup(currentUserService.getCurrentUser());
    }

    @PostMapping("/mfa/confirm")
    public ProfileView confirmMfaSetup(@Valid @RequestBody MfaProfileConfirmRequest request) {
        return profileService.confirmMfaSetup(currentUserService.getCurrentUser(), request.code());
    }
}

package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.MfaSetupResponse;
import com.jagorczyk.gymManagement.api.dto.ProfileDtos.ChangePasswordRequest;
import com.jagorczyk.gymManagement.api.dto.ProfileDtos.ProfileView;
import com.jagorczyk.gymManagement.api.dto.ProfileDtos.UpdateProfileRequest;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MfaService mfaService;

    public ProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder, MfaService mfaService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mfaService = mfaService;
    }

    @Transactional(readOnly = true)
    public ProfileView getProfile(User user) {
        return toView(user);
    }

    @Transactional
    public ProfileView updateProfile(User user, UpdateProfileRequest request) {
        if (request.firstName() != null) {
            user.setFirstName(request.firstName().isBlank() ? null : request.firstName().trim());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName().isBlank() ? null : request.lastName().trim());
        }
        return toView(userRepository.save(user));
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        if (isGoogleLinked(user)) {
            throw new IllegalArgumentException("Konta Google nie mogą zmieniać hasła w aplikacji.");
        }
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new IllegalArgumentException("To konto nie ma ustawionego hasła.");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Obecne hasło jest nieprawidłowe.");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new IllegalArgumentException("Nowe hasło musi różnić się od obecnego.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public MfaSetupResponse beginMfaSetup(User user) {
        return mfaService.beginProfileSetup(user);
    }

    @Transactional
    public ProfileView confirmMfaSetup(User user, String code) {
        mfaService.confirmProfileSetup(user, code);
        return toView(userRepository.findById(user.getId()).orElseThrow());
    }

    private ProfileView toView(User user) {
        boolean googleLinked = isGoogleLinked(user);
        return new ProfileView(
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                googleLinked,
                !googleLinked,
                user.isMfaEnabled(),
                MfaService.isMfaMandatory(user)
        );
    }

    private boolean isGoogleLinked(User user) {
        return user.getGoogleId() != null && !user.getGoogleId().isBlank();
    }
}

package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.AuthResponse;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.GoogleAuthRequest;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.UserRepository;
import com.jagorczyk.gymManagement.security.GoogleTokenVerifier;
import com.jagorczyk.gymManagement.security.GoogleUserInfo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoogleAuthService {
    private final GoogleTokenVerifier googleTokenVerifier;
    private final UserRepository userRepository;
    private final MfaService mfaService;

    public GoogleAuthService(
            GoogleTokenVerifier googleTokenVerifier,
            UserRepository userRepository,
            MfaService mfaService
    ) {
        this.googleTokenVerifier = googleTokenVerifier;
        this.userRepository = userRepository;
        this.mfaService = mfaService;
    }

    @Transactional
    public AuthResponse loginOrRegister(GoogleAuthRequest request) {
        GoogleUserInfo googleUser = googleTokenVerifier.verify(request.idToken());
        User user = resolveUser(googleUser, request.role());
        return mfaService.resolveAuthResponse(user);
    }

    private User resolveUser(GoogleUserInfo googleUser, Role requestedRole) {
        return userRepository.findByGoogleId(googleUser.googleId())
                .or(() -> userRepository.findByEmail(googleUser.email()))
                .map(existing -> linkExistingUser(existing, googleUser))
                .orElseGet(() -> createNewUser(googleUser, requestedRole));
    }

    private User linkExistingUser(User user, GoogleUserInfo googleUser) {
        if (user.getGoogleId() != null && !user.getGoogleId().equals(googleUser.googleId())) {
            throw new IllegalArgumentException("To konto e-mail jest powiązane z innym kontem Google");
        }
        if (user.getGoogleId() == null) {
            user.setGoogleId(googleUser.googleId());
        }
        applyGoogleProfile(user, googleUser);
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        return userRepository.save(user);
    }

    private User createNewUser(GoogleUserInfo googleUser, Role requestedRole) {
        if (requestedRole == null) {
            throw new IllegalArgumentException("Konto nie istnieje — zarejestruj się lub skontaktuj się z administratorem");
        }
        if (requestedRole == Role.EMPLOYEE || requestedRole == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Konto nie istnieje — skontaktuj się z administratorem");
        }
        if (requestedRole != Role.GUEST && requestedRole != Role.OWNER) {
            throw new IllegalArgumentException("Nieobsługiwana rola rejestracji");
        }

        User user = new User();
        user.setEmail(googleUser.email());
        user.setGoogleId(googleUser.googleId());
        user.setRole(requestedRole);
        user.setEmailVerified(true);
        applyGoogleProfile(user, googleUser);
        return userRepository.save(user);
    }

    private void applyGoogleProfile(User user, GoogleUserInfo googleUser) {
        if (user.getFirstName() == null && googleUser.firstName() != null) {
            user.setFirstName(googleUser.firstName());
        }
        if (user.getLastName() == null && googleUser.lastName() != null) {
            user.setLastName(googleUser.lastName());
        }
        if (user.getAvatarUrl() == null && googleUser.pictureUrl() != null) {
            user.setAvatarUrl(googleUser.pictureUrl());
        }
    }
}

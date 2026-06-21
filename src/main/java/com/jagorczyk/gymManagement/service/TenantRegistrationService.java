package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.TenantRegistrationRequest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.GymSubscription;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.SaaSPlan;
import com.jagorczyk.gymManagement.domain.SubscriptionStatus;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.GymSubscriptionRepository;
import com.jagorczyk.gymManagement.repository.SaaSPlanRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import com.jagorczyk.gymManagement.security.GoogleTokenVerifier;
import com.jagorczyk.gymManagement.security.GoogleUserInfo;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TenantRegistrationService {

    private final UserRepository userRepository;
    private final GymRepository gymRepository;
    private final SaaSPlanRepository saasPlanRepository;
    private final GymSubscriptionRepository gymSubscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final StripeService stripeService;
    private final EmailService emailService;
    private final SubdomainService subdomainService;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Transactional
    public String registerTenant(TenantRegistrationRequest request) throws StripeException {
        validateAuthCredentials(request);
        normalizeOwnerNames(request);

        SaaSPlan plan = saasPlanRepository.findById(request.getSaasPlanId())
                .orElseThrow(() -> new IllegalArgumentException("SaaS Plan not found"));

        if (userRepository.findByEmail(request.getOwnerEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User owner = new User();
        owner.setFirstName(request.getOwnerFirstName());
        owner.setLastName(request.getOwnerLastName());
        owner.setRole(Role.OWNER);

        boolean googleRegistration = hasGoogleToken(request);
        if (googleRegistration) {
            GoogleUserInfo googleUser = googleTokenVerifier.verify(request.getGoogleIdToken());
            if (!googleUser.email().equalsIgnoreCase(request.getOwnerEmail())) {
                throw new IllegalArgumentException("Adres e-mail nie zgadza się z kontem Google");
            }
            owner.setEmail(googleUser.email());
            owner.setGoogleId(googleUser.googleId());
            owner.setEmailVerified(true);
            if (owner.getFirstName() == null && googleUser.firstName() != null) {
                owner.setFirstName(googleUser.firstName());
            }
            if (owner.getLastName() == null && googleUser.lastName() != null) {
                owner.setLastName(googleUser.lastName());
            }
            if (googleUser.pictureUrl() != null) {
                owner.setAvatarUrl(googleUser.pictureUrl());
            }
        } else {
            owner.setEmail(request.getOwnerEmail());
            owner.setPasswordHash(passwordEncoder.encode(request.getOwnerPassword()));
            owner.setEmailVerified(false);
            String code = String.format("%06d", new java.util.Random().nextInt(999999));
            owner.setVerificationCode(code);
        }

        owner = userRepository.save(owner);

        if (!googleRegistration) {
            emailService.sendVerificationEmail(owner.getEmail(), owner.getVerificationCode());
        }

        String gymName = googleRegistration ? "Twoja Siłownia (Tymczasowa)" : request.getGymName();
        String gymCity = googleRegistration ? "-" : request.getGymCity();
        String gymAddress = googleRegistration ? "-" : request.getGymAddress();
        String gymPostalCode = googleRegistration ? "00-000" : request.getGymPostalCode();
        String gymNip = googleRegistration ? "0000000000" : request.getGymNip();

        Gym gym = new Gym();
        gym.setName(gymName);
        gym.setSubdomain(subdomainService.generateUniqueSubdomain(gymName));
        gym.setAddress(gymAddress);
        gym.setCity(gymCity);
        gym.setPostalCode(gymPostalCode);
        gym.setNip(gymNip);
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);

        GymSubscription subscription = new GymSubscription();
        subscription.setGym(gym);
        subscription.setSaasPlan(plan);
        subscription.setStatus(SubscriptionStatus.UNPAID);
        subscription.setCurrentPeriodStart(null);
        subscription.setCurrentPeriodEnd(null);
        gymSubscriptionRepository.save(subscription);

        return "success";
    }

    private void validateAuthCredentials(TenantRegistrationRequest request) {
        boolean hasPassword = request.getOwnerPassword() != null && !request.getOwnerPassword().isBlank();
        boolean hasGoogle = hasGoogleToken(request);
        if (hasPassword == hasGoogle) {
            throw new IllegalArgumentException("Podaj hasło lub zaloguj się przez Google");
        }
    }

    private boolean hasGoogleToken(TenantRegistrationRequest request) {
        return request.getGoogleIdToken() != null && !request.getGoogleIdToken().isBlank();
    }

    private void normalizeOwnerNames(TenantRegistrationRequest request) {
        if (request.getOwnerFirstName() != null) {
            request.setOwnerFirstName(request.getOwnerFirstName().trim());
        }
        if (request.getOwnerLastName() == null || request.getOwnerLastName().isBlank()) {
            request.setOwnerLastName("-");
        } else {
            request.setOwnerLastName(request.getOwnerLastName().trim());
        }
    }
}

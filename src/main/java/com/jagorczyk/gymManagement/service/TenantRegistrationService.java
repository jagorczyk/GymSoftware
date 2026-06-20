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
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

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

    @Transactional
    public String registerTenant(TenantRegistrationRequest request) throws StripeException {
        // 1. Verify SaaS plan
        SaaSPlan plan = saasPlanRepository.findById(request.getSaasPlanId())
                .orElseThrow(() -> new IllegalArgumentException("SaaS Plan not found"));

        // 2. Create Owner User
        if (userRepository.findByEmail(request.getOwnerEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User owner = new User();
        owner.setFirstName(request.getOwnerFirstName());
        owner.setLastName(request.getOwnerLastName());
        owner.setEmail(request.getOwnerEmail());
        owner.setPasswordHash(passwordEncoder.encode(request.getOwnerPassword()));
        owner.setRole(Role.OWNER);
        owner.setEmailVerified(false);
        String code = String.format("%06d", new java.util.Random().nextInt(999999));
        owner.setVerificationCode(code);
        owner = userRepository.save(owner);

        emailService.sendVerificationEmail(owner.getEmail(), code);

        // 3. Create Gym
        Gym gym = new Gym();
        gym.setName(request.getGymName());
        gym.setSubdomain(subdomainService.generateUniqueSubdomain(request.getGymName()));
        gym.setAddress(request.getGymAddress());
        gym.setCity(request.getGymCity());
        gym.setPostalCode(request.getGymPostalCode());
        gym.setNip(request.getGymNip());
        gym.setOwnerUser(owner);
        gym = gymRepository.save(gym);

        // 4. Create GymSubscription (Unpaid Status)
        GymSubscription subscription = new GymSubscription();
        subscription.setGym(gym);
        subscription.setSaasPlan(plan);
        subscription.setStatus(SubscriptionStatus.UNPAID);
        subscription.setCurrentPeriodStart(null);
        subscription.setCurrentPeriodEnd(null);
        gymSubscriptionRepository.save(subscription);

        // 5. Return success
        return "success";
    }
}

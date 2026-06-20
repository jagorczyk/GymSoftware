package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.AuthResponse;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.LoginRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.RegisterRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.VerifyEmailRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.ResendVerificationRequest;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.UserRepository;
import com.jagorczyk.gymManagement.security.CustomUserPrincipal;
import com.jagorczyk.gymManagement.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Konto z adresem e-mail " + request.email() + " jest już zarejestrowane.");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        
        user.setEmailVerified(false);
        String code = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setVerificationCode(code);

        User saved = userRepository.save(user);
        
        emailService.sendVerificationEmail(saved.getEmail(), code);
        
        return new AuthResponse(null);
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));
        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Email jest już zweryfikowany");
        }
        if (!request.code().equals(user.getVerificationCode())) {
            throw new IllegalArgumentException("Nieprawidłowy kod weryfikacyjny");
        }
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(new CustomUserPrincipal(user)));
    }

    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));
        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Email jest już zweryfikowany");
        }
        
        String newCode = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setVerificationCode(newCode);
        userRepository.save(user);
        
        emailService.sendVerificationEmail(user.getEmail(), newCode);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("Konto nie jest zweryfikowane");
        }
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return new AuthResponse(jwtService.generateToken(principal));
    }
}

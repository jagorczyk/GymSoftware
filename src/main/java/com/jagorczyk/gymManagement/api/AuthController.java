package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.AuthResponse;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.LoginRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.RegisterRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.VerifyEmailRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.ResendVerificationRequest;
import com.jagorczyk.gymManagement.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/verify-email")
    public AuthResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return authService.verifyEmail(request);
    }

    @PostMapping("/resend-verification")
    public void resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}

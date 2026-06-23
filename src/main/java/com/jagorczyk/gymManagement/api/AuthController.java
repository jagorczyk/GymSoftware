package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.AuthResponse;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.GoogleAuthRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.MfaSetupResponse;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.LoginRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.RegisterRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.VerifyEmailRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.MfaCodeRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.MfaTokenRequest;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.ResendVerificationRequest;
import com.jagorczyk.gymManagement.service.AuthService;
import com.jagorczyk.gymManagement.service.GoogleAuthService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final GoogleAuthService googleAuthService;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
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

    @PostMapping("/google")
    public AuthResponse loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        return googleAuthService.loginOrRegister(request);
    }

    @PostMapping("/mfa/setup")
    public MfaSetupResponse beginMfaSetup(@Valid @RequestBody MfaTokenRequest request) {
        return authService.beginMfaSetup(request.mfaToken());
    }

    @PostMapping("/mfa/confirm")
    public AuthResponse confirmMfaSetup(@Valid @RequestBody MfaCodeRequest request) {
        return authService.completeMfaSetup(request.mfaToken(), request.code());
    }

    @PostMapping("/mfa/verify")
    public AuthResponse verifyMfaLogin(
            @Valid @RequestBody MfaCodeRequest request,
            HttpServletRequest httpRequest
    ) {
        boolean rememberDevice = Boolean.TRUE.equals(request.rememberDevice());
        String userAgent = httpRequest.getHeader("User-Agent");
        return authService.verifyMfaLogin(request.mfaToken(), request.code(), rememberDevice, userAgent);
    }
}

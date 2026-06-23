package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.AuthDtos.AuthResponse;
import com.jagorczyk.gymManagement.api.dto.AuthDtos.MfaSetupResponse;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.UserRepository;
import com.jagorczyk.gymManagement.security.CustomUserPrincipal;
import com.jagorczyk.gymManagement.security.JwtService;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import java.util.Base64;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MfaService {
    private static final String ISSUER = "Gymlos";

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TrustedMfaDeviceService trustedMfaDeviceService;
    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(new DefaultCodeGenerator(), timeProvider);

    public MfaService(
            UserRepository userRepository,
            JwtService jwtService,
            TrustedMfaDeviceService trustedMfaDeviceService
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.trustedMfaDeviceService = trustedMfaDeviceService;
    }

    public static boolean isMfaMandatory(User user) {
        return user.getRole() == Role.OWNER || user.getRole() == Role.SUPER_ADMIN;
    }

    public AuthResponse resolveAuthResponse(User user, String trustedDeviceToken) {
        if (user.isMfaEnabled() && user.getMfaSecret() != null && !user.getMfaSecret().isBlank()) {
            if (trustedMfaDeviceService.isTrusted(user.getId(), trustedDeviceToken)) {
                return AuthResponse.withToken(jwtService.generateToken(new CustomUserPrincipal(user)));
            }
            return AuthResponse.mfaChallenge(jwtService.generateMfaToken(user.getId(), "challenge"));
        }
        if (isMfaMandatory(user)) {
            return AuthResponse.mfaSetup(jwtService.generateMfaToken(user.getId(), "setup"));
        }
        return AuthResponse.withToken(jwtService.generateToken(new CustomUserPrincipal(user)));
    }

    @Transactional
    public MfaSetupResponse createSetup(String mfaToken) {
        User user = loadUserForMfa(mfaToken, "setup");
        if (!isMfaMandatory(user)) {
            throw new IllegalArgumentException("MFA nie jest wymagane dla tego konta");
        }

        String secret = secretGenerator.generate();
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);
        userRepository.save(user);
        return buildSetupResponse(user.getEmail(), secret);
    }

    @Transactional
    public AuthResponse confirmSetup(String mfaToken, String code) {
        User user = loadUserForMfa(mfaToken, "setup");
        if (user.getMfaSecret() == null || user.getMfaSecret().isBlank()) {
            throw new IllegalArgumentException("Skonfiguruj MFA przed potwierdzeniem");
        }
        if (!verifyCode(user.getMfaSecret(), code)) {
            throw new IllegalArgumentException("Nieprawidłowy kod MFA");
        }
        user.setMfaEnabled(true);
        userRepository.save(user);
        return AuthResponse.withToken(jwtService.generateToken(new CustomUserPrincipal(user)));
    }

    @Transactional
    public AuthResponse verifyLogin(String mfaToken, String code, boolean rememberDevice, String userAgent) {
        User user = loadUserForMfa(mfaToken, "challenge");
        if (!user.isMfaEnabled() || user.getMfaSecret() == null || user.getMfaSecret().isBlank()) {
            throw new IllegalArgumentException("MFA nie jest skonfigurowane");
        }
        if (!verifyCode(user.getMfaSecret(), code)) {
            throw new IllegalArgumentException("Nieprawidłowy kod MFA");
        }
        String token = jwtService.generateToken(new CustomUserPrincipal(user));
        if (!rememberDevice) {
            return AuthResponse.withToken(token);
        }
        String trustedDeviceToken = trustedMfaDeviceService.createTrustedDevice(user.getId(), userAgent);
        return AuthResponse.withTokenAndTrustedDevice(token, trustedDeviceToken);
    }

    @Transactional
    public MfaSetupResponse beginProfileSetup(User user) {
        if (user.isMfaEnabled()) {
            throw new IllegalArgumentException("MFA jest już włączone na tym koncie");
        }

        String secret = secretGenerator.generate();
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);
        userRepository.save(user);
        return buildSetupResponse(user.getEmail(), secret);
    }

    @Transactional
    public void confirmProfileSetup(User user, String code) {
        if (user.isMfaEnabled()) {
            throw new IllegalArgumentException("MFA jest już włączone na tym koncie");
        }
        if (user.getMfaSecret() == null || user.getMfaSecret().isBlank()) {
            throw new IllegalArgumentException("Rozpocznij konfigurację MFA przed potwierdzeniem");
        }
        if (!verifyCode(user.getMfaSecret(), code)) {
            throw new IllegalArgumentException("Nieprawidłowy kod MFA");
        }
        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    private User loadUserForMfa(String mfaToken, String purpose) {
        Long userId = jwtService.validateMfaToken(mfaToken, purpose);
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika"));
    }

    private boolean verifyCode(String secret, String code) {
        String normalized = code == null ? "" : code.replaceAll("\\s+", "");
        return codeVerifier.isValidCode(secret, normalized);
    }

    private MfaSetupResponse buildSetupResponse(String email, String secret) {
        QrData data = new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        try {
            byte[] imageData = qrGenerator.generate(data);
            String qrCodeDataUrl = "data:image/png;base64," + Base64.getEncoder().encodeToString(imageData);
            return new MfaSetupResponse(secret, qrCodeDataUrl, data.getUri());
        } catch (QrGenerationException ex) {
            throw new IllegalStateException("Nie udało się wygenerować kodu QR", ex);
        }
    }
}

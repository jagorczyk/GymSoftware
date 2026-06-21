package com.jagorczyk.gymManagement.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes
    ) {
        byte[] keyBytes = Decoders.BASE64.decode(java.util.Base64.getEncoder().encodeToString(secret.getBytes()));
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMinutes = expirationMinutes;
    }

    public String generateMfaToken(Long userId, String purpose) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("purpose", purpose)
                .claim("mfa", true)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(10 * 60)))
                .signWith(key)
                .compact();
    }

    public Long validateMfaToken(String token, String expectedPurpose) {
        Claims claims = extractClaims(token);
        if (!Boolean.TRUE.equals(claims.get("mfa"))) {
            throw new IllegalArgumentException("Nieprawidłowy token MFA");
        }
        if (!expectedPurpose.equals(claims.get("purpose"))) {
            throw new IllegalArgumentException("Nieprawidłowy token MFA");
        }
        return Long.parseLong(claims.getSubject());
    }

    public String generateToken(CustomUserPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("uid", principal.getUserId())
                .claim("role", principal.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
                .signWith(key)
                .compact();
    }

    public String generateCheckInToken(CustomUserPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("uid", principal.getUserId())
                .claim("purpose", "checkin")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(60)))
                .signWith(key)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims extractCheckInClaims(String token) {
        Claims claims = extractClaims(token);
        if (!"checkin".equals(claims.get("purpose"))) {
            throw new IllegalArgumentException("Nieprawidłowy token QR.");
        }
        return claims;
    }
}

package com.jagorczyk.gymManagement.api;

public record ImpersonationResponse(
        String token,
        String role,
        String email,
        Long impersonatorUserId,
        String impersonatorEmail
) {}

package com.jagorczyk.gymManagement.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TenantRegistrationRequest {
    @NotBlank
    private String ownerFirstName;
    @NotBlank
    private String ownerLastName;
    @Email
    @NotBlank
    private String ownerEmail;
    @NotBlank
    private String ownerPassword;
    @NotNull
    private Long saasPlanId;
    @NotBlank
    private String gymName;
    @NotBlank
    private String gymCity;
    @NotBlank
    private String gymAddress;
    @NotBlank
    @jakarta.validation.constraints.Pattern(regexp = "^\\d{2}-\\d{3}$", message = "Nieprawidłowy kod pocztowy (wymagany format: 00-000)")
    private String gymPostalCode;
    @NotBlank
    @jakarta.validation.constraints.Pattern(regexp = "^\\d{10}$", message = "NIP musi składać się z 10 cyfr")
    private String gymNip;
}

package com.jagorczyk.gymManagement.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateSaaSPlanRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @Size(max = 1000) String features,
        Boolean active
) {}

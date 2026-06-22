package com.jagorczyk.gymManagement.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ExtendSubscriptionRequest(
        @NotNull @Min(1) @Max(365) Integer days,
        boolean reactivate
) {}

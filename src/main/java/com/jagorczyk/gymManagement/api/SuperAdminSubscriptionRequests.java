package com.jagorczyk.gymManagement.api;

import jakarta.validation.constraints.Size;
import java.util.Map;

public final class SuperAdminSubscriptionRequests {

    private SuperAdminSubscriptionRequests() {}

    public record UpdateSubscriptionNotesRequest(@Size(max = 5000) String adminNotes) {}

    public record UpdateFeatureOverridesRequest(Map<String, Boolean> overrides) {}
}

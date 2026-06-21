package com.jagorczyk.gymManagement.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jagorczyk.gymManagement.domain.SaaSPlanFeature;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;

public final class SaaSPlanFeatureFlags {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private SaaSPlanFeatureFlags() {}

    public static List<SaaSPlanFeature> parse(String json) {
        if (json == null || json.isBlank()) {
            return SaaSPlanFeature.all();
        }
        try {
            List<String> raw = MAPPER.readValue(json, new TypeReference<>() {});
            List<SaaSPlanFeature> parsed = new ArrayList<>();
            for (String value : raw) {
                parsed.add(SaaSPlanFeature.valueOf(value));
            }
            return parsed.isEmpty() ? SaaSPlanFeature.all() : parsed;
        } catch (Exception ex) {
            return SaaSPlanFeature.all();
        }
    }

    public static String serialize(Collection<SaaSPlanFeature> features) {
        if (features == null || features.isEmpty()) {
            return "[]";
        }
        try {
            return MAPPER.writeValueAsString(features.stream().map(Enum::name).toList());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Nie udało się zapisać funkcji planu");
        }
    }

    public static boolean hasFeature(String json, SaaSPlanFeature feature) {
        return EnumSet.copyOf(parse(json)).contains(feature);
    }
}

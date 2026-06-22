package com.jagorczyk.gymManagement.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jagorczyk.gymManagement.domain.SaaSPlanFeature;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    public static Map<String, Boolean> parseOverrides(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, Boolean> raw = MAPPER.readValue(json, new TypeReference<>() {});
            Map<String, Boolean> normalized = new LinkedHashMap<>();
            for (Map.Entry<String, Boolean> entry : raw.entrySet()) {
                normalized.put(entry.getKey(), Boolean.TRUE.equals(entry.getValue()));
            }
            return normalized;
        } catch (Exception ex) {
            return Map.of();
        }
    }

    public static String serializeOverrides(Map<String, Boolean> overrides) {
        if (overrides == null || overrides.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(overrides);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Nie udało się zapisać nadpisań funkcji planu");
        }
    }

    public static List<SaaSPlanFeature> resolveEffective(String planJson, String overridesJson) {
        EnumSet<SaaSPlanFeature> effective = EnumSet.copyOf(parse(planJson));
        for (Map.Entry<String, Boolean> entry : parseOverrides(overridesJson).entrySet()) {
            SaaSPlanFeature feature = SaaSPlanFeature.valueOf(entry.getKey());
            if (Boolean.TRUE.equals(entry.getValue())) {
                effective.add(feature);
            } else {
                effective.remove(feature);
            }
        }
        return List.copyOf(effective);
    }

    public static List<String> resolveEffectiveNames(String planJson, String overridesJson) {
        return resolveEffective(planJson, overridesJson).stream().map(Enum::name).toList();
    }
}

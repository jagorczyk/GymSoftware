package com.jagorczyk.gymManagement.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.jagorczyk.gymManagement.service.SaaSPlanFeatureFlags;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "saas_plans")
public class SaaSPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "stripe_product_id")
    private String stripeProductId;

    @Column(name = "stripe_price_id")
    private String stripePriceId;

    @Column(length = 1000)
    private String features;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @JsonIgnore
    @Column(name = "feature_flags")
    private String featureFlagsJson;

    @JsonProperty("featureFlags")
    public List<String> getFeatureFlags() {
        return SaaSPlanFeatureFlags.parse(featureFlagsJson).stream().map(Enum::name).toList();
    }

    @JsonProperty("featureFlags")
    public void setFeatureFlags(List<String> featureFlags) {
        if (featureFlags == null || featureFlags.isEmpty()) {
            this.featureFlagsJson = SaaSPlanFeatureFlags.serialize(SaaSPlanFeature.all());
            return;
        }
        List<SaaSPlanFeature> parsed = featureFlags.stream().map(SaaSPlanFeature::valueOf).toList();
        this.featureFlagsJson = SaaSPlanFeatureFlags.serialize(parsed);
    }
}

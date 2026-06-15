package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.config.StripeProperties;
import com.jagorczyk.gymManagement.domain.PassType;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class StripeService {

    private final StripeProperties stripeProperties;

    @org.springframework.beans.factory.annotation.Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeProperties.getApi().getKey();
    }

    public String createCheckoutSession(PassType passType, Long gymId, Long userId) throws StripeException {
        // Ensure price is in cents for Stripe
        long amountInCents = passType.getPrice().multiply(BigDecimal.valueOf(100)).longValue();

        String successUrl = stripeProperties.getSuccess().getUrl().replace("{gymId}", gymId.toString());
        String cancelUrl = stripeProperties.getCancel().getUrl().replace("{gymId}", gymId.toString());

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .putMetadata("userId", userId.toString())
                .putMetadata("gymId", gymId.toString())
                .putMetadata("passTypeId", passType.getId().toString())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("pln")
                                                .setUnitAmount(amountInCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(passType.getName() + " (" + passType.getDurationDays() + " dni)")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .build();

        Session session = Session.create(params);
        return session.getUrl();
    }

    public String[] createStripeProductAndPrice(String name, String description, String taxCode, long amountInCents, String currency) throws StripeException {
        com.stripe.net.RequestOptions.RequestOptionsBuilder optionsBuilder = com.stripe.net.RequestOptions.builder();
        com.stripe.net.RequestOptions.RequestOptionsBuilder.unsafeSetStripeVersionOverride(optionsBuilder, "2026-02-25.preview");
        com.stripe.net.RequestOptions options = optionsBuilder.build();

        java.util.Map<String, Object> params = new java.util.HashMap<>();
        params.put("name", name);
        params.put("description", description);
        params.put("tax_code", taxCode);

        java.util.Map<String, Object> defaultPriceData = new java.util.HashMap<>();
        defaultPriceData.put("unit_amount", amountInCents);
        defaultPriceData.put("currency", currency);

        java.util.Map<String, Object> recurring = new java.util.HashMap<>();
        recurring.put("interval", "month");
        defaultPriceData.put("recurring", recurring);

        params.put("default_price_data", defaultPriceData);

        com.stripe.model.Product product = com.stripe.model.Product.create(params, options);
        return new String[]{product.getId(), product.getDefaultPrice()};
    }

    public String createSaaSSubscriptionCheckout(com.jagorczyk.gymManagement.domain.SaaSPlan plan, Long gymId) throws StripeException {
        if (plan.getStripePriceId() == null || plan.getStripePriceId().isEmpty()) {
            String taxCode = "txcd_10103100"; // Digital product tax code
            long amountInCents = plan.getPrice().multiply(java.math.BigDecimal.valueOf(100)).longValue();
            String currency = "pln";
            
            String[] productAndPrice = createStripeProductAndPrice(
                plan.getName(),
                plan.getFeatures() != null ? plan.getFeatures() : "A subscription to our service",
                taxCode,
                amountInCents,
                currency
            );
            plan.setStripeProductId(productAndPrice[0]);
            plan.setStripePriceId(productAndPrice[1]);
        }

        String successUrl = frontendUrl + "/admin/subscription-success?gymId=" + gymId;
        String cancelUrl = frontendUrl + "/admin/subscription-cancel?gymId=" + gymId;

        com.stripe.net.RequestOptions.RequestOptionsBuilder optionsBuilder = com.stripe.net.RequestOptions.builder();
        com.stripe.net.RequestOptions.RequestOptionsBuilder.unsafeSetStripeVersionOverride(optionsBuilder, "2026-02-25.preview");
        com.stripe.net.RequestOptions options = optionsBuilder.build();

        java.util.Map<String, Object> params = new java.util.HashMap<>();
        params.put("mode", "subscription");
        params.put("success_url", successUrl);
        params.put("cancel_url", cancelUrl);

        java.util.Map<String, String> metadata = new java.util.HashMap<>();
        metadata.put("gymId", gymId.toString());
        metadata.put("saasPlanId", plan.getId().toString());
        metadata.put("isSaaS", "true");
        params.put("metadata", metadata);

        java.util.Map<String, Object> managedPayments = new java.util.HashMap<>();
        managedPayments.put("enabled", true);
        params.put("managed_payments", managedPayments);

        java.util.List<Object> lineItems = new java.util.ArrayList<>();
        java.util.Map<String, Object> lineItem = new java.util.HashMap<>();
        if (plan.getStripePriceId() != null && !plan.getStripePriceId().isEmpty()) {
            lineItem.put("price", plan.getStripePriceId());
        } else {
            java.util.Map<String, Object> priceData = new java.util.HashMap<>();
            priceData.put("currency", "pln");
            priceData.put("unit_amount", plan.getPrice().multiply(java.math.BigDecimal.valueOf(100)).longValue());
            
            java.util.Map<String, Object> productData = new java.util.HashMap<>();
            productData.put("name", plan.getName() + " Subscription");
            priceData.put("product_data", productData);

            java.util.Map<String, Object> recurring = new java.util.HashMap<>();
            recurring.put("interval", "month");
            priceData.put("recurring", recurring);

            lineItem.put("price_data", priceData);
        }
        lineItem.put("quantity", 1);
        lineItems.add(lineItem);
        params.put("line_items", lineItems);

        com.stripe.model.checkout.Session session = com.stripe.model.checkout.Session.create(params, options);
        return session.getUrl();
    }

    public void cancelSubscription(String stripeSubscriptionId) throws StripeException {
        com.stripe.model.Subscription subscription = com.stripe.model.Subscription.retrieve(stripeSubscriptionId);
        subscription.cancel();
    }
}

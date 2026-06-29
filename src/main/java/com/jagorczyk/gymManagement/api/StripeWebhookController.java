package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.config.StripeProperties;
import com.jagorczyk.gymManagement.service.ClientPortalService;
import com.jagorczyk.gymManagement.service.SaaSSubscriptionService;
import com.jagorczyk.gymManagement.service.ScheduledJobTracker;
import com.jagorczyk.gymManagement.service.StripeConnectService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Account;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.model.Subscription;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final StripeProperties stripeProperties;
    private final ClientPortalService clientPortalService;
    private final SaaSSubscriptionService saasSubscriptionService;
    private final ScheduledJobTracker scheduledJobTracker;
    private final StripeConnectService stripeConnectService;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        Event event = null;

        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeProperties.getWebhook().getSecret());
        } catch (SignatureVerificationException e) {
            scheduledJobTracker.recordFailure("stripe_webhook", "Invalid signature");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (Exception e) {
            scheduledJobTracker.recordFailure("stripe_webhook", "Invalid payload");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
        }

        scheduledJobTracker.recordSuccess("stripe_webhook", event.getType());
        if ("checkout.session.completed".equals(event.getType())) {
            Session session = null;
            try {
                session = (Session) event.getDataObjectDeserializer().deserializeUnsafe();
            } catch (Exception e) {
                System.err.println("Failed to deserialize session: " + e.getMessage());
            }

            if (session != null) {
                if ("payment".equals(session.getMode())) {
                    String userIdStr = session.getMetadata().get("userId");
                    String gymIdStr = session.getMetadata().get("gymId");
                    String passTypeIdStr = session.getMetadata().get("passTypeId");

                    if (userIdStr != null && gymIdStr != null && passTypeIdStr != null) {
                        try {
                            Long userId = Long.valueOf(userIdStr);
                            Long gymId = Long.valueOf(gymIdStr);
                            Long passTypeId = Long.valueOf(passTypeIdStr);
                            
                            clientPortalService.activatePassFromStripe(userId, gymId, passTypeId);
                        } catch (Exception e) {
                            System.err.println("Failed to activate pass: " + e.getMessage());
                            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                        }
                    }
                } else if ("subscription".equals(session.getMode())) {
                    String isSaaS = session.getMetadata().get("isSaaS");
                    if ("true".equals(isSaaS)) {
                        String gymIdStr = session.getMetadata().get("gymId");
                        if (gymIdStr != null) {
                            try {
                                Long gymId = Long.valueOf(gymIdStr);
                                saasSubscriptionService.activateSubscription(gymId, session.getSubscription(), session.getCustomer());
                            } catch (Exception e) {
                                System.err.println("Failed to activate SaaS subscription: " + e.getMessage());
                                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                            }
                        }
                    }
                }
            }
        } else if ("customer.subscription.created".equals(event.getType()) || "customer.subscription.updated".equals(event.getType()) || "customer.subscription.deleted".equals(event.getType())) {
            Subscription subscription = null;
            try {
                subscription = (Subscription) event.getDataObjectDeserializer().deserializeUnsafe();
            } catch (Exception e) {
                System.err.println("Failed to deserialize subscription: " + e.getMessage());
            }
            if (subscription != null) {
                saasSubscriptionService.handleSubscriptionWebhook(subscription);
            }
        } else if ("account.updated".equals(event.getType())) {
            Account account = null;
            try {
                account = (Account) event.getDataObjectDeserializer().deserializeUnsafe();
            } catch (Exception e) {
                System.err.println("Failed to deserialize account: " + e.getMessage());
            }
            if (account != null) {
                stripeConnectService.handleAccountUpdated(account);
            }
        }

        return ResponseEntity.ok("Success");
    }
}

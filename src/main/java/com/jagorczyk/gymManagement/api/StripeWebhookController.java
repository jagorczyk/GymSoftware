package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.config.StripeProperties;
import com.jagorczyk.gymManagement.service.ClientPortalService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
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

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        Event event = null;

        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeProperties.getWebhook().getSecret());
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);

            if (session != null && "payment".equals(session.getMode())) {
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
            }
        }

        return ResponseEntity.ok("Success");
    }
}

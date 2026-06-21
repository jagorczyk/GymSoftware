package com.jagorczyk.gymManagement.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GoogleTokenVerifier {
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        if (clientId == null || clientId.isBlank()) {
            this.verifier = null;
        } else {
            this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
        }
    }

    public GoogleUserInfo verify(String idToken) {
        if (verifier == null) {
            throw new IllegalStateException("Google OAuth nie jest skonfigurowane (brak GOOGLE_CLIENT_ID)");
        }
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new IllegalArgumentException("Nieprawidłowy token Google");
            }
            GoogleIdToken.Payload payload = token.getPayload();
            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified == null || !emailVerified) {
                throw new IllegalArgumentException("Adres e-mail Google nie jest zweryfikowany");
            }
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Token Google nie zawiera adresu e-mail");
            }
            return new GoogleUserInfo(
                    payload.getSubject(),
                    email,
                    (String) payload.get("given_name"),
                    (String) payload.get("family_name"),
                    (String) payload.get("picture"),
                    true
            );
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalArgumentException("Nie udało się zweryfikować tokenu Google", e);
        }
    }
}

package com.jagorczyk.gymManagement.api;

import com.stripe.exception.StripeException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class RestExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleIllegalArgument(IllegalArgumentException ex) {
        return Map.of("error", ex.getMessage());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "Wystąpił błąd podczas wykonywania operacji.";
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", message));
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, String> handleBadCredentials() {
        return Map.of("error", "Nieprawidłowy adres e-mail lub hasło.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleValidation(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Nieprawidłowe dane formularza.");
        return Map.of("error", "Błąd walidacji: " + details + ".");
    }

    @ExceptionHandler(InvalidDataAccessResourceUsageException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, String> handleInvalidDataAccess(InvalidDataAccessResourceUsageException ex) {
        String message = ex.getMostSpecificCause().getMessage();
        if (message != null && message.toLowerCase().contains("support_message")) {
            return Map.of(
                    "error",
                    "Brak tabel wiadomości w bazie danych. Zrestartuj backend, aby uruchomić migrację V46."
            );
        }
        log.error("Błąd dostępu do bazy danych", ex);
        return Map.of("error", "Błąd zapytania do bazy danych. Sprawdź logi backendu.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleDataIntegrity(DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause().getMessage();
        if (message != null && message.contains("employee_permissions_permission_check")) {
            return Map.of("error", "Nieprawidłowe uprawnienie pracownika. Odśwież stronę i spróbuj ponownie.");
        }
        if (message != null && message.contains("lockers_status_check")) {
            return Map.of("error", "Nie udało się zaktualizować statusu szafki. Zrestartuj backend, aby zastosować migracje bazy.");
        }
        if (message != null && message.toLowerCase().contains("key_code")) {
            return Map.of("error", "Baza danych wymaga aktualizacji (stara kolumna key_code). Zrestartuj backend, aby uruchomić migracje.");
        }
        if (message != null && message.toLowerCase().contains("null value") && message.toLowerCase().contains("locker_assignments")) {
            return Map.of("error", "Nie udało się nadać szafki — baza danych wymaga migracji. Zrestartuj backend.");
        }
        return Map.of("error", "Operacja naruszyła reguły bazy danych. Sprawdź dane i spróbuj ponownie.");
    }

    @ExceptionHandler(StripeException.class)
    public ResponseEntity<Map<String, String>> handleStripe(StripeException ex) {
        log.error("Stripe error [code={}]: {}", ex.getCode(), ex.getUserMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", mapStripeError(ex)));
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, String> handleUnexpected(Exception ex) {
        log.error("Nieobsłużony wyjątek", ex);
        return Map.of("error", "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.");
    }

    private static String mapStripeError(StripeException ex) {
        String message = ex.getUserMessage() != null ? ex.getUserMessage() : ex.getMessage();
        if (message == null || message.isBlank()) {
            return "Błąd usługi płatności Stripe. Spróbuj ponownie później.";
        }
        String lower = message.toLowerCase();
        if (lower.contains("signed up for connect") || lower.contains("connect")) {
            return "Stripe Connect nie jest włączony na koncie platformy. Administrator musi aktywować Connect w panelu Stripe.";
        }
        if (lower.contains("url") && lower.contains("https")) {
            return "Nieprawidłowy adres powrotu po konfiguracji. W panelu Stripe dodaj dozwolone adresy dla subdomen siłowni (np. https://*.gymlos.pl/owner/payouts).";
        }
        if (lower.contains("platform profile")) {
            return "Profil platformy Stripe jest niekompletny. Dokończ konfigurację konta Stripe (Connect).";
        }
        return "Stripe: " + message;
    }
}

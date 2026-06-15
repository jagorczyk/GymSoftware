UPDATE saas_plans SET is_active = FALSE;

INSERT INTO saas_plans (name, price, features, is_active)
VALUES (
    'Premium', 
    100.00, 
    'Pełny dostęp do systemu, Nielimitowani klienci, Panel pracownika i trenera, Grafiki zajęć, Powiadomienia e-mail, Wsparcie 24/7',
    TRUE
);

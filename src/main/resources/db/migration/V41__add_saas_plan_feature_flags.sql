ALTER TABLE saas_plans ADD COLUMN feature_flags TEXT;

UPDATE saas_plans
SET feature_flags = '["SCHEDULE","WORK_SCHEDULE","TRAINER_BOOKINGS","LOCKERS","INVENTORY","ANALYTICS","CRM","CLASS_RATINGS","NOTIFICATIONS","SALES_REPORT","AUDIT_LOG"]'
WHERE feature_flags IS NULL;

INSERT INTO saas_plans (name, price, features, is_active, feature_flags)
SELECT 'Starter', 49.00, 'Klienci, karnety, szafki i raporty — idealny na start', TRUE,
       '["LOCKERS","SALES_REPORT","AUDIT_LOG"]'
WHERE NOT EXISTS (SELECT 1 FROM saas_plans WHERE name = 'Starter');

INSERT INTO saas_plans (name, price, features, is_active, feature_flags)
SELECT 'Pro', 99.00, 'Grafiki, trenerzy, zajęcia i powiadomienia', TRUE,
       '["LOCKERS","SALES_REPORT","AUDIT_LOG","SCHEDULE","WORK_SCHEDULE","TRAINER_BOOKINGS","CLASS_RATINGS","NOTIFICATIONS"]'
WHERE NOT EXISTS (SELECT 1 FROM saas_plans WHERE name = 'Pro');

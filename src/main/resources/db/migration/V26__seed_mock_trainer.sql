-- Wstawienie testowego trenera (jeśli istnieje pracownik o ID 1)
INSERT INTO personal_trainer_profiles (employee_id, gym_id, bio, specialization, hourly_rate)
SELECT 1, gym_id, 'Mistrz świata w podnoszeniu ciężarów. Pomogę Ci zbudować wymarzoną sylwetkę bez wymówek!', 'Kulturystyka, Trening Siłowy', 150.00
FROM employees 
WHERE id = 1
ON CONFLICT DO NOTHING;

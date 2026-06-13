-- Nadaj SELL_PRODUCTS wszystkim istniejącym rangom, które go jeszcze nie mają
INSERT INTO employee_rank_permissions (rank_id, permission)
SELECT r.id, 'SELL_PRODUCTS'
FROM employee_ranks r
WHERE NOT EXISTS (
    SELECT 1 FROM employee_rank_permissions rp
    WHERE rp.rank_id = r.id AND rp.permission = 'SELL_PRODUCTS'
);

-- Nadaj SELL_PRODUCTS wszystkim pracownikom bezpośrednio (fallback gdy brak rangi)
INSERT INTO employee_permissions (employee_id, permission)
SELECT e.id, 'SELL_PRODUCTS'
FROM employees e
ON CONFLICT DO NOTHING;

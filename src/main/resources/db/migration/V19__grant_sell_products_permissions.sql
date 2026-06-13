-- Automatyczne nadanie uprawnienia SELL_PRODUCTS wszystkim obecnym pracownikom
INSERT INTO employee_permissions (employee_id, permission)
SELECT e.id, 'SELL_PRODUCTS' FROM employees e
ON CONFLICT DO NOTHING;

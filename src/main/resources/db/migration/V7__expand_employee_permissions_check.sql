-- Hibernate (ddl-auto=update) may add employee_permissions_permission_check with an outdated enum list.
ALTER TABLE employee_permissions DROP CONSTRAINT IF EXISTS employee_permissions_permission_check;

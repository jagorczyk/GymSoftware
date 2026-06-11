CREATE TABLE employee_permissions (
    employee_id BIGINT NOT NULL,
    permission VARCHAR(50) NOT NULL,
    PRIMARY KEY (employee_id, permission),
    CONSTRAINT fk_employee_permissions_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

INSERT INTO employee_permissions (employee_id, permission)
SELECT e.id, 'VIEW_DASHBOARD' FROM employees e;

INSERT INTO employee_permissions (employee_id, permission)
SELECT e.id, 'MANAGE_GUESTS' FROM employees e;

INSERT INTO employee_permissions (employee_id, permission)
SELECT e.id, 'SELL_PASSES' FROM employees e;

INSERT INTO employee_permissions (employee_id, permission)
SELECT e.id, 'MANAGE_LOCKERS' FROM employees e;

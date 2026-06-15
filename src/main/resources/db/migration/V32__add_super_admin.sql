INSERT INTO users (email, password_hash, first_name, last_name, role, created_at)
VALUES (
    'admin@gymmanagement.com',
    '$2a$10$A.46Xb3X/LpB3EwG1u8eKuxP3E/E/jV6h5F8VzM8g9wD8K9E8fDMO',
    'Super',
    'Admin',
    'SUPER_ADMIN',
    CURRENT_TIMESTAMP
);

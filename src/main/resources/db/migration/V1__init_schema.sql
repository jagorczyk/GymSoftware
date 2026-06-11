CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gyms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    owner_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gym_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
    CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE guests (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_guest_gym FOREIGN KEY (gym_id) REFERENCES gyms(id)
);

CREATE TABLE passes (
    id BIGSERIAL PRIMARY KEY,
    guest_id BIGINT NOT NULL,
    gym_id BIGINT NOT NULL,
    pass_type VARCHAR(60) NOT NULL,
    status VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    sold_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pass_guest FOREIGN KEY (guest_id) REFERENCES guests(id),
    CONSTRAINT fk_pass_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
    CONSTRAINT fk_pass_sold_by FOREIGN KEY (sold_by_user_id) REFERENCES users(id)
);

CREATE TABLE lockers (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    locker_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_locker_number_per_gym UNIQUE (gym_id, locker_number),
    CONSTRAINT fk_locker_gym FOREIGN KEY (gym_id) REFERENCES gyms(id)
);

CREATE TABLE locker_assignments (
    id BIGSERIAL PRIMARY KEY,
    locker_id BIGINT NOT NULL,
    guest_id BIGINT NOT NULL,
    assigned_by_user_id BIGINT NOT NULL,
    key_code VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    returned_at TIMESTAMP,
    CONSTRAINT fk_locker_assignment_locker FOREIGN KEY (locker_id) REFERENCES lockers(id),
    CONSTRAINT fk_locker_assignment_guest FOREIGN KEY (guest_id) REFERENCES guests(id),
    CONSTRAINT fk_locker_assignment_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id)
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT,
    actor_user_id BIGINT,
    action VARCHAR(120) NOT NULL,
    payload TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE INDEX idx_gyms_owner_user_id ON gyms(owner_user_id);
CREATE INDEX idx_employees_gym_id ON employees(gym_id);
CREATE INDEX idx_guests_gym_id ON guests(gym_id);
CREATE INDEX idx_passes_guest_id ON passes(guest_id);
CREATE INDEX idx_passes_gym_id ON passes(gym_id);
CREATE INDEX idx_lockers_gym_id ON lockers(gym_id);
CREATE INDEX idx_locker_assignments_locker_id ON locker_assignments(locker_id);
CREATE INDEX idx_locker_assignments_guest_id ON locker_assignments(guest_id);
CREATE INDEX idx_audit_logs_gym_id ON audit_logs(gym_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

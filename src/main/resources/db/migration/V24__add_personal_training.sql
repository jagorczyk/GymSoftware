ALTER TABLE users ADD COLUMN first_name VARCHAR(120);
ALTER TABLE users ADD COLUMN last_name VARCHAR(120);

CREATE TABLE personal_trainer_profiles (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    gym_id BIGINT NOT NULL,
    bio TEXT,
    specialization VARCHAR(255),
    hourly_rate DECIMAL(10, 2),
    CONSTRAINT fk_pt_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_gym FOREIGN KEY (gym_id) REFERENCES gyms (id) ON DELETE CASCADE
);

CREATE TABLE personal_trainings (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    trainer_id BIGINT NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    price DECIMAL(10, 2),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_training_gym FOREIGN KEY (gym_id) REFERENCES gyms (id) ON DELETE CASCADE,
    CONSTRAINT fk_training_client FOREIGN KEY (client_id) REFERENCES guests (id) ON DELETE CASCADE,
    CONSTRAINT fk_training_trainer FOREIGN KEY (trainer_id) REFERENCES employees (id) ON DELETE CASCADE
);

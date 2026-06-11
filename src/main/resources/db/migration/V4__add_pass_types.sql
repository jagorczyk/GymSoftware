CREATE TABLE pass_types (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pass_type_gym FOREIGN KEY (gym_id) REFERENCES gyms(id)
);

CREATE INDEX idx_pass_types_gym_id ON pass_types(gym_id);

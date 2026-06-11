ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);
ALTER TABLE guests ADD COLUMN avatar_url VARCHAR(255);

CREATE TABLE employee_ranks (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_rank_permissions (
    rank_id BIGINT NOT NULL REFERENCES employee_ranks(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL
);

ALTER TABLE employees ADD COLUMN rank_id BIGINT REFERENCES employee_ranks(id) ON DELETE SET NULL;

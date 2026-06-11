CREATE TABLE IF NOT EXISTS employee_work_schedule_entries (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL REFERENCES gyms(id),
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    entry_type VARCHAR(30) NOT NULL,
    title VARCHAR(255),
    note TEXT,
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NOT NULL,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_schedule_gym_range ON employee_work_schedule_entries (gym_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_work_schedule_gym_employee ON employee_work_schedule_entries (gym_id, employee_id);

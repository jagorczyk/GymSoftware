ALTER TABLE gym_subscriptions
    ADD COLUMN admin_notes TEXT,
    ADD COLUMN feature_flag_overrides TEXT;

CREATE TABLE super_admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT NOT NULL REFERENCES users(id),
    action VARCHAR(120) NOT NULL,
    target_type VARCHAR(60),
    target_id BIGINT,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_super_admin_audit_logs_created_at ON super_admin_audit_logs(created_at DESC);

CREATE TABLE scheduled_job_runs (
    job_name VARCHAR(120) PRIMARY KEY,
    last_run_at TIMESTAMP NOT NULL,
    last_status VARCHAR(30) NOT NULL,
    last_message TEXT
);

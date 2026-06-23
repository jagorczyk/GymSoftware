CREATE TABLE mfa_trusted_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_agent VARCHAR(512)
);

CREATE INDEX idx_mfa_trusted_devices_user_hash ON mfa_trusted_devices(user_id, token_hash);
CREATE INDEX idx_mfa_trusted_devices_expires_at ON mfa_trusted_devices(expires_at);

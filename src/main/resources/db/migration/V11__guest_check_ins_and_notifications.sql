ALTER TABLE guests ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE guests ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE guest_check_ins (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    guest_id BIGINT NOT NULL,
    checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checked_out_at TIMESTAMP,
    checked_in_by_user_id BIGINT NOT NULL,
    checked_out_by_user_id BIGINT,
    CONSTRAINT fk_guest_check_in_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
    CONSTRAINT fk_guest_check_in_guest FOREIGN KEY (guest_id) REFERENCES guests(id),
    CONSTRAINT fk_guest_check_in_by FOREIGN KEY (checked_in_by_user_id) REFERENCES users(id),
    CONSTRAINT fk_guest_check_out_by FOREIGN KEY (checked_out_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_guest_check_ins_gym_id ON guest_check_ins(gym_id);
CREATE INDEX idx_guest_check_ins_guest_id ON guest_check_ins(guest_id);
CREATE INDEX idx_guest_check_ins_active ON guest_check_ins(gym_id, guest_id) WHERE checked_out_at IS NULL;

CREATE TABLE gym_notification_settings (
    gym_id BIGINT PRIMARY KEY,
    expiring_pass_email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    expiring_pass_days_before INT NOT NULL DEFAULT 7,
    notification_email VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_settings_gym FOREIGN KEY (gym_id) REFERENCES gyms(id)
);

CREATE TABLE gym_notifications (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    type VARCHAR(60) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    guest_id BIGINT,
    pass_id BIGINT,
    read_at TIMESTAMP,
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gym_notification_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
    CONSTRAINT fk_gym_notification_guest FOREIGN KEY (guest_id) REFERENCES guests(id),
    CONSTRAINT fk_gym_notification_pass FOREIGN KEY (pass_id) REFERENCES passes(id)
);

CREATE INDEX idx_gym_notifications_gym_id ON gym_notifications(gym_id);
CREATE INDEX idx_gym_notifications_created_at ON gym_notifications(created_at);

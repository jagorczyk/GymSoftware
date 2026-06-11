ALTER TABLE guests ADD COLUMN user_id BIGINT;
ALTER TABLE guests ADD CONSTRAINT fk_guest_user FOREIGN KEY (user_id) REFERENCES users(id);

CREATE INDEX idx_guests_user_id ON guests(user_id);

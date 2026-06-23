CREATE TABLE support_message_threads (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    guest_id BIGINT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    client_last_read_at TIMESTAMP,
    staff_last_read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_support_thread_gym FOREIGN KEY (gym_id) REFERENCES gyms(id),
    CONSTRAINT fk_support_thread_guest FOREIGN KEY (guest_id) REFERENCES guests(id),
    CONSTRAINT support_thread_status_check CHECK (status IN ('OPEN', 'CLOSED'))
);

CREATE INDEX idx_support_threads_gym_id ON support_message_threads(gym_id);
CREATE INDEX idx_support_threads_guest_id ON support_message_threads(guest_id);
CREATE INDEX idx_support_threads_updated_at ON support_message_threads(updated_at DESC);

CREATE TABLE support_messages (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL,
    sender_user_id BIGINT NOT NULL,
    sender_side VARCHAR(20) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_support_message_thread FOREIGN KEY (thread_id) REFERENCES support_message_threads(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_message_sender FOREIGN KEY (sender_user_id) REFERENCES users(id),
    CONSTRAINT support_message_sender_side_check CHECK (sender_side IN ('CLIENT', 'STAFF'))
);

CREATE INDEX idx_support_messages_thread_id ON support_messages(thread_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);

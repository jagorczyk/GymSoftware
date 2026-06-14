CREATE TABLE email_campaigns (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL REFERENCES gyms(id),
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    target_segment VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP
);

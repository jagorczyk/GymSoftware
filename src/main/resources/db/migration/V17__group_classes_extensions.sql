CREATE TABLE class_ratings (
    id BIGSERIAL PRIMARY KEY,
    group_class_id BIGINT NOT NULL,
    guest_id BIGINT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rating_class FOREIGN KEY (group_class_id) REFERENCES group_classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_guest FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
    CONSTRAINT uq_rating_guest_class UNIQUE (group_class_id, guest_id)
);

CREATE TABLE pass_freezes (
    id BIGSERIAL PRIMARY KEY,
    gym_pass_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_freeze_pass FOREIGN KEY (gym_pass_id) REFERENCES passes(id) ON DELETE CASCADE
);

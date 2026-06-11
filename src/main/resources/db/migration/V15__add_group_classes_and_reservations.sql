CREATE TABLE group_classes (
    id SERIAL PRIMARY KEY,
    gym_id INTEGER NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    instructor_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    capacity INTEGER NOT NULL
);

CREATE TABLE class_reservations (
    id SERIAL PRIMARY KEY,
    group_class_id INTEGER NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    reserved_at TIMESTAMP NOT NULL,
    UNIQUE(group_class_id, guest_id)
);

ALTER TABLE group_classes ALTER COLUMN id TYPE BIGINT;
ALTER TABLE group_classes ALTER COLUMN gym_id TYPE BIGINT;
ALTER TABLE group_classes ALTER COLUMN instructor_id TYPE BIGINT;

ALTER TABLE class_reservations ALTER COLUMN id TYPE BIGINT;
ALTER TABLE class_reservations ALTER COLUMN group_class_id TYPE BIGINT;
ALTER TABLE class_reservations ALTER COLUMN guest_id TYPE BIGINT;

ALTER TABLE pass_types ADD COLUMN max_entries INTEGER;
ALTER TABLE passes ADD COLUMN max_entries INTEGER;
ALTER TABLE passes ADD COLUMN remaining_entries INTEGER;

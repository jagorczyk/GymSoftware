-- Legacy Hibernate schemas may still require key_code on locker_assignments (removed in V3).
ALTER TABLE locker_assignments DROP COLUMN IF EXISTS key_code;

-- Prevent stale Hibernate CHECK constraints on locker status.
ALTER TABLE lockers DROP CONSTRAINT IF EXISTS lockers_status_check;

UPDATE lockers SET status = 'AVAILABLE' WHERE status = 'FREE';

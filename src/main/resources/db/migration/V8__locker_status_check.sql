-- Hibernate (ddl-auto=update) may add an outdated CHECK on lockers.status (e.g. FREE instead of AVAILABLE).
ALTER TABLE lockers DROP CONSTRAINT IF EXISTS lockers_status_check;

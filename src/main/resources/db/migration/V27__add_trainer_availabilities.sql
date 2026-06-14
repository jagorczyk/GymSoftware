CREATE TABLE trainer_availabilities (
    id BIGSERIAL PRIMARY KEY,
    trainer_profile_id BIGINT NOT NULL REFERENCES personal_trainer_profiles(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Drop the old employee permissions check constraint and recreate it with PERSONAL_TRAINER
ALTER TABLE employee_permissions DROP CONSTRAINT IF EXISTS chk_employee_permissions;
ALTER TABLE employee_permissions
    ADD CONSTRAINT chk_employee_permissions CHECK (
        permission IN (
            'VIEW_DASHBOARD',
            'MANAGE_GUESTS',
            'SELL_PASSES',
            'MANAGE_LOCKERS',
            'CREATE_LOCKERS',
            'MANAGE_PASS_TYPES',
            'MANAGE_SCHEDULE',
            'MANAGE_WORK_SCHEDULE',
            'MANAGE_CLASSES',
            'MANAGE_PRODUCTS',
            'SELL_PRODUCTS',
            'PERSONAL_TRAINER'
        )
    );

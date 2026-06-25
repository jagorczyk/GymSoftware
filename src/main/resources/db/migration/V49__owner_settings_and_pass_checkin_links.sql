ALTER TABLE passes ADD COLUMN pass_type_id BIGINT;
ALTER TABLE passes ADD CONSTRAINT fk_pass_pass_type FOREIGN KEY (pass_type_id) REFERENCES pass_types(id);

ALTER TABLE guest_check_ins ADD COLUMN gym_pass_id BIGINT;
ALTER TABLE guest_check_ins ADD COLUMN entry_consumed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE guest_check_ins ADD CONSTRAINT fk_checkin_pass FOREIGN KEY (gym_pass_id) REFERENCES passes(id);

CREATE TABLE owner_settings (
    owner_user_id BIGINT PRIMARY KEY,
    pass_deduct_timing VARCHAR(20) NOT NULL DEFAULT 'CHECK_IN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_settings_user FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE owner_default_employee_permissions (
    owner_user_id BIGINT NOT NULL,
    permission VARCHAR(50) NOT NULL,
    PRIMARY KEY (owner_user_id, permission),
    CONSTRAINT fk_owner_def_perm_settings FOREIGN KEY (owner_user_id) REFERENCES owner_settings(owner_user_id)
);

UPDATE passes SET pass_type_id = (
    SELECT pt.id FROM pass_types pt
    WHERE pt.gym_id = passes.gym_id AND UPPER(pt.name) = UPPER(passes.pass_type)
    FETCH FIRST 1 ROW ONLY
) WHERE pass_type_id IS NULL;

UPDATE passes SET
    max_entries = (SELECT pt.max_entries FROM pass_types pt WHERE pt.id = passes.pass_type_id),
    remaining_entries = (SELECT pt.max_entries FROM pass_types pt WHERE pt.id = passes.pass_type_id)
WHERE pass_type_id IS NOT NULL
  AND remaining_entries IS NULL
  AND (SELECT pt.max_entries FROM pass_types pt WHERE pt.id = passes.pass_type_id) IS NOT NULL;

ALTER TABLE gyms
    ADD COLUMN stripe_connect_account_id VARCHAR(255),
    ADD COLUMN stripe_connect_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN stripe_connect_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN stripe_connect_details_submitted BOOLEAN NOT NULL DEFAULT FALSE;

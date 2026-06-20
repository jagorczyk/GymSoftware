ALTER TABLE gyms ADD COLUMN subdomain VARCHAR(255) UNIQUE;
UPDATE gyms SET subdomain = CONCAT('gym-', id) WHERE subdomain IS NULL;

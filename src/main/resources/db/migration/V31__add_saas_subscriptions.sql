CREATE TABLE saas_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stripe_product_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    features VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE gym_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    saas_plan_id BIGINT NOT NULL REFERENCES saas_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed some default SaaS plans
INSERT INTO saas_plans (name, price, features) VALUES
('Starter', 49.00, 'Up to 100 members, Basic Reporting'),
('Pro', 99.00, 'Unlimited members, Advanced CRM, Classes'),
('Enterprise', 199.00, 'Custom Branding, Priority Support');

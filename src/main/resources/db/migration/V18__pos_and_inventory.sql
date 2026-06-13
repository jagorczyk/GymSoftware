CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);

CREATE TABLE product_sales (
    id BIGSERIAL PRIMARY KEY,
    gym_id BIGINT NOT NULL,
    sold_by_user_id BIGINT NOT NULL,
    guest_id BIGINT,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_sale_gym FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_sale_sold_by FOREIGN KEY (sold_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_sale_guest FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL
);

CREATE TABLE product_sale_items (
    id BIGSERIAL PRIMARY KEY,
    product_sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    CONSTRAINT fk_sale_item_sale FOREIGN KEY (product_sale_id) REFERENCES product_sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_sale_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX idx_products_gym_id ON products(gym_id);
CREATE INDEX idx_product_sales_gym_id ON product_sales(gym_id);
CREATE INDEX idx_product_sales_created_at ON product_sales(created_at);
CREATE INDEX idx_product_sale_items_sale_id ON product_sale_items(product_sale_id);

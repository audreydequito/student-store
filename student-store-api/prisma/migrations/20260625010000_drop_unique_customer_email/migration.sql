-- customer_email stays required (NOT NULL) but is no longer unique:
-- the same email may appear on multiple orders.
DROP INDEX IF EXISTS "orders_customer_email_key";

-- Backfill any NULL customer_email rows with a unique placeholder so the
-- NOT NULL + UNIQUE constraints below can be applied without failing.
UPDATE "orders"
SET "customer_email" = 'order-' || "order_id" || '@placeholder.local'
WHERE "customer_email" IS NULL;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "customer_email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_customer_email_key" ON "orders"("customer_email");

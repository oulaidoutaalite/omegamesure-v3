-- Add ItemKind enum and Product.kind column to distinguish products from services.
-- Existing rows are backfilled to PRODUCT (the historical meaning).

DO $$ BEGIN
  CREATE TYPE "ItemKind" AS ENUM ('PRODUCT', 'SERVICE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "kind" "ItemKind" NOT NULL DEFAULT 'PRODUCT';

CREATE INDEX IF NOT EXISTS "Product_kind_idx" ON "Product"("kind");

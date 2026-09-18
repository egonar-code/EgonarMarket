-- EgonarMarket: safe upgrade for existing databases.
-- Run once against the existing PostgreSQL database before deploying universe-aware APIs.
ALTER TABLE products ADD COLUMN IF NOT EXISTS universe TEXT NOT NULL DEFAULT 'MARKET';
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_universe_check;
ALTER TABLE products ADD CONSTRAINT products_universe_check CHECK (universe IN ('MARKET','SAVEURS','EVASION'));
CREATE INDEX IF NOT EXISTS idx_products_universe ON products(universe);
CREATE INDEX IF NOT EXISTS idx_products_universe_active ON products(universe,active,created_at DESC);
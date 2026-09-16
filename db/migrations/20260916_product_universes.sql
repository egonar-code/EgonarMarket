-- EgonarMarket: discriminator for the three connected commercial universes.
-- Safe to run against an existing database; legacy products stay in MARKET.
ALTER TABLE products ADD COLUMN IF NOT EXISTS universe TEXT NOT NULL DEFAULT 'MARKET';
UPDATE products SET universe = 'MARKET' WHERE universe IS NULL OR universe = '';
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_universe_check;
ALTER TABLE products ADD CONSTRAINT products_universe_check CHECK (universe IN ('MARKET','SAVEURS','EVASION'));
CREATE INDEX IF NOT EXISTS idx_products_universe ON products(universe);
CREATE INDEX IF NOT EXISTS idx_products_universe_active ON products(universe, active);

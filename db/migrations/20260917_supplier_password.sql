ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

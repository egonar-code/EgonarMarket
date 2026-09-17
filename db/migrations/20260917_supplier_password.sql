ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

UPDATE suppliers
SET password_hash = '$2a$10$7EqJtq98hPqEX7fNZaFWoO7c1u2fVQ0r8Qv6zY8GmY8mV4c7mXj9e'
WHERE password_hash IS NULL;

ALTER TABLE suppliers
  ALTER COLUMN password_hash SET NOT NULL;

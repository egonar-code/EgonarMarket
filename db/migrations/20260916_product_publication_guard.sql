-- EgonarMarket: publication guard for supplier-submitted products.
-- Pending/rejected products must never be publicly orderable or visible.

UPDATE products
SET active = FALSE,
    updated_at = NOW()
WHERE approval_status IS DISTINCT FROM 'APPROVED';

CREATE OR REPLACE FUNCTION egonar_enforce_product_publication_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM 'APPROVED' THEN
    NEW.active := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_publication_state ON products;

CREATE TRIGGER trg_products_publication_state
BEFORE INSERT OR UPDATE OF approval_status, active
ON products
FOR EACH ROW
EXECUTE FUNCTION egonar_enforce_product_publication_state();

CREATE INDEX IF NOT EXISTS idx_products_public_approval
  ON products(universe, active, approval_status, created_at DESC);

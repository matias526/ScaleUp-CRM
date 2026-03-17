-- Eliminar el campo industry viejo de end_customers
-- Solo ejecutar después de confirmar que industry_id funciona correctamente

ALTER TABLE end_customers DROP COLUMN IF EXISTS industry;

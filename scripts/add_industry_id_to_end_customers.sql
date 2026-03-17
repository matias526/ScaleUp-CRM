-- Agregar la columna industry_id como FK a la tabla end_customers
ALTER TABLE end_customers 
ADD COLUMN industry_id UUID REFERENCES industries(id);

-- Crear índice para mejorar performance
CREATE INDEX idx_end_customers_industry_id ON end_customers(industry_id);

-- Comentario para documentar el cambio
COMMENT ON COLUMN end_customers.industry_id IS 'Foreign key reference to industries table';

-- Opcional: Migrar datos existentes si hay industrias en texto
-- UPDATE end_customers 
-- SET industry_id = (
--   SELECT id FROM industries 
--   WHERE LOWER(industries.name) = LOWER(end_customers.industry)
--   LIMIT 1
-- )
-- WHERE industry IS NOT NULL;

-- Nota: Mantener la columna industry por compatibilidad hasta confirmar que todo funciona
-- Después se puede eliminar con: ALTER TABLE end_customers DROP COLUMN industry;

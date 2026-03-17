-- Agregar columna country a la tabla opportunities
ALTER TABLE opportunities ADD COLUMN country VARCHAR(100);

-- Comentario para la columna
COMMENT ON COLUMN opportunities.country IS 'País al que pertenece la oportunidad';

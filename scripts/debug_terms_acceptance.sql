-- Verificar la estructura de la tabla user_terms_acceptance
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'user_terms_acceptance';

-- Verificar si hay registros en la tabla
SELECT * FROM user_terms_acceptance;

-- Verificar si hay restricciones de unicidad
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM
  information_schema.table_constraints tc
JOIN
  information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE
  tc.table_name = 'user_terms_acceptance'
  AND tc.constraint_type = 'UNIQUE';

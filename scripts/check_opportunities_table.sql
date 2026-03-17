-- Verificar la estructura de la tabla opportunities
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'opportunities'
ORDER BY 
  ordinal_position;

-- Verificar si la tabla opportunities existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'opportunities'
);

-- Verificar si hay datos en la tabla opportunities
SELECT COUNT(*) FROM opportunities;

-- Mostrar los primeros 5 registros de la tabla opportunities (si existen)
SELECT * FROM opportunities LIMIT 5;

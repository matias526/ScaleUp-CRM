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

-- Verificar la estructura de la tabla pipeline_stages
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'pipeline_stages'
ORDER BY 
  ordinal_position;

-- Verificar la estructura de la tabla opportunity_tech_fields
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'opportunity_tech_fields'
ORDER BY 
  ordinal_position;

-- Verificar la estructura de la tabla tech_fields
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'tech_fields'
ORDER BY 
  ordinal_position;

-- Verificar las restricciones de clave foránea para la tabla opportunities
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'opportunities';

-- Verificar las restricciones de clave foránea para la tabla opportunity_tech_fields
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'opportunity_tech_fields';

-- Verificar si hay datos en la tabla opportunities
SELECT COUNT(*) FROM opportunities;

-- Verificar si hay datos en la tabla pipeline_stages
SELECT * FROM pipeline_stages ORDER BY display_order;

-- Verificar si hay datos en la tabla opportunity_tech_fields
SELECT COUNT(*) FROM opportunity_tech_fields;

-- Verificar si hay datos en la tabla tech_fields
SELECT COUNT(*) FROM tech_fields;

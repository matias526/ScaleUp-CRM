-- Verificar la estructura de la tabla de oportunidades
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'opportunities';

-- Verificar las claves foráneas de la tabla de oportunidades
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

-- Verificar si hay oportunidades en la base de datos
SELECT COUNT(*) FROM opportunities;

-- Verificar si hay etapas de pipeline en la base de datos
SELECT COUNT(*) FROM pipeline_stages;

-- Verificar si hay empresas tecnológicas en la base de datos
SELECT COUNT(*) FROM tech_companies;

-- Verificar si hay partners en la base de datos
SELECT COUNT(*) FROM partners;

-- Verificar si hay clientes finales en la base de datos
SELECT COUNT(*) FROM end_customers;

-- Obtener una muestra de oportunidades con sus relaciones
SELECT 
  o.id,
  o.title,
  o.pipeline_stage_id,
  ps.code AS stage_code,
  o.tech_company_id,
  tc.name AS tech_company_name,
  o.partner_id,
  p.name AS partner_name,
  o.end_customer_id,
  ec.name AS end_customer_name
FROM 
  opportunities o
  LEFT JOIN pipeline_stages ps ON o.pipeline_stage_id = ps.id
  LEFT JOIN tech_companies tc ON o.tech_company_id = tc.id
  LEFT JOIN partners p ON o.partner_id = p.id
  LEFT JOIN end_customers ec ON o.end_customer_id = ec.id
LIMIT 5;

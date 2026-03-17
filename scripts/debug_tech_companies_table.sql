-- Verificar la estructura de la tabla tech_companies
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'tech_companies';

-- Verificar los permisos de la tabla tech_companies
SELECT
  grantee,
  privilege_type
FROM
  information_schema.role_table_grants
WHERE
  table_name = 'tech_companies';

-- Verificar las políticas de seguridad de la tabla tech_companies
SELECT
  *
FROM
  pg_policies
WHERE
  tablename = 'tech_companies';

-- Contar el número de registros en la tabla tech_companies
SELECT
  COUNT(*)
FROM
  tech_companies;

-- Obtener una muestra de los datos de la tabla tech_companies
SELECT
  id,
  name,
  code,
  is_active,
  created_at,
  updated_at
FROM
  tech_companies
LIMIT 10;

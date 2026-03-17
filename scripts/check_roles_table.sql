-- Verificar la estructura de la tabla roles
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'roles';

-- Verificar los datos en la tabla roles
SELECT * FROM roles;

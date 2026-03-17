-- Verificar la estructura de la tabla partner_tech_companies
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'partner_tech_companies';

-- Verificar si hay registros con scaleup_manager_id no nulo
SELECT 
  count(*) as total_records,
  count(scaleup_manager_id) as records_with_manager
FROM 
  partner_tech_companies;

-- Verificar algunos ejemplos de registros
SELECT 
  ptc.id,
  ptc.tech_company_id,
  tc.name as tech_company_name,
  ptc.partner_id,
  p.name as partner_name,
  ptc.scaleup_manager_id,
  u.email as manager_email,
  u.first_name as manager_first_name,
  u.last_name as manager_last_name
FROM 
  partner_tech_companies ptc
LEFT JOIN 
  tech_companies tc ON ptc.tech_company_id = tc.id
LEFT JOIN 
  partners p ON ptc.partner_id = p.id
LEFT JOIN 
  users u ON ptc.scaleup_manager_id = u.id
LIMIT 10;

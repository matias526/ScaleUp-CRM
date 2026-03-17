-- Verificar si la tabla partner_countries existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'partner_countries'
) as "exists";

-- Verificar la estructura de la tabla partner_countries
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'partner_countries';

-- Verificar si hay registros en la tabla
SELECT COUNT(*) as total_records FROM partner_countries;

-- Verificar si hay relaciones correctas con la tabla countries
SELECT 
    pc.partner_id, 
    p.name as partner_name,
    pc.country_id, 
    c.name as country_name,
    c.code as country_code
FROM 
    partner_countries pc
JOIN 
    partners p ON pc.partner_id = p.id
JOIN 
    countries c ON pc.country_id = c.id
LIMIT 10;

-- Verificar si hay países sin relaciones
SELECT 
    c.id, 
    c.name, 
    c.code,
    (SELECT COUNT(*) FROM partner_countries pc WHERE pc.country_id = c.id) as partner_count
FROM 
    countries c
ORDER BY 
    partner_count ASC, 
    c.name ASC
LIMIT 20;

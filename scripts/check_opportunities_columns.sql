-- Consultar la estructura de la tabla opportunities
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

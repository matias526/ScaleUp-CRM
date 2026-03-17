-- Consulta para verificar la estructura de la tabla translations
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'translations';

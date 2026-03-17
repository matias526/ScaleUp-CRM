-- Verificar si la tabla opportunity_notes existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'opportunity_notes'
) AS table_exists;

-- Obtener la estructura de la tabla opportunity_notes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'opportunity_notes'
ORDER BY ordinal_position;

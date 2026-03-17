-- Verificar si la tabla kb_learning_examples existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'kb_learning_examples'
) as table_exists;

-- Si existe, mostrar su estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'kb_learning_examples'
ORDER BY ordinal_position;

-- Contar registros si existe
SELECT COUNT(*) as total_examples
FROM kb_learning_examples;

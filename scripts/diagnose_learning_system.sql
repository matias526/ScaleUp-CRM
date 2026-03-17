-- Diagnóstico del sistema de aprendizaje de Mika

-- 1. Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'kb_learning_examples'
) as table_exists;

-- 2. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kb_learning_examples'
ORDER BY ordinal_position;

-- 3. Contar ejemplos de aprendizaje guardados
SELECT COUNT(*) as total_examples
FROM kb_learning_examples;

-- 4. Ver los últimos 5 ejemplos guardados
SELECT 
  id,
  original_question,
  original_answer,
  correction,
  improved_answer,
  created_at,
  vector_dims(question_embedding) as embedding_dimensions
FROM kb_learning_examples
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar si la función match_learning_examples existe
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'match_learning_examples'
) as function_exists;

-- 6. Ver definición de la función si existe
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'match_learning_examples';

-- Verificar que la función de búsqueda existe y funciona
-- 1. Verificar ejemplos guardados
SELECT 
  id,
  user_query,
  mika_response,
  user_correction,
  created_at
FROM kb_learning_examples
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar si la función match_learning_examples existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'match_learning_examples';

-- 3. Contar total de ejemplos por tech_company
SELECT 
  tc.name as tech_company,
  COUNT(*) as total_examples
FROM kb_learning_examples le
JOIN tech_companies tc ON tc.id = le.tech_company_id
GROUP BY tc.name;

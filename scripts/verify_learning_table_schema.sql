SELECT 
  column_name,
  data_type,
  udt_name,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'kb_learning_examples'
ORDER BY ordinal_position;

-- También verificar si hay errores en los logs
SELECT * FROM kb_learning_examples LIMIT 5;

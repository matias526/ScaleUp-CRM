-- Verificar la estructura completa de la tabla kb_learning_examples
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'kb_learning_examples'
ORDER BY ordinal_position;

-- Verificar si la columna query_embedding tiene el tipo vector correcto
SELECT 
    atttypid::regtype as column_type,
    atttypmod as type_modifier
FROM pg_attribute
WHERE attrelid = 'kb_learning_examples'::regclass 
AND attname = 'query_embedding';

-- Intentar insertar un ejemplo de prueba para ver el error exacto
DO $$
DECLARE
    test_embedding text := '[0.1, 0.2, 0.3]';
BEGIN
    INSERT INTO kb_learning_examples (
        tech_company_id,
        user_id,
        conversation_id,
        user_query,
        correct_answer,
        is_positive,
        query_embedding
    ) VALUES (
        (SELECT id FROM tech_companies LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1),
        gen_random_uuid(),
        'Test query',
        'Test answer',
        true,
        test_embedding::vector
    );
    
    RAISE NOTICE 'Insert successful!';
    
    -- Limpiar el test
    DELETE FROM kb_learning_examples WHERE user_query = 'Test query';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

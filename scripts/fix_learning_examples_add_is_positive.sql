-- Agregar la columna is_positive si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'kb_learning_examples' 
        AND column_name = 'is_positive'
    ) THEN
        ALTER TABLE kb_learning_examples 
        ADD COLUMN is_positive BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Columna is_positive agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna is_positive ya existe';
    END IF;
END $$;

-- Verificar la estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'kb_learning_examples'
ORDER BY ordinal_position;

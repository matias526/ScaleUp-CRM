-- Verificar si la columna file_config ya existe y actualizar registros existentes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'opportunity_tech_fields'
        AND column_name = 'file_config'
    ) THEN
        -- Agregar la columna file_config como JSONB
        ALTER TABLE opportunity_tech_fields
        ADD COLUMN file_config JSONB;
        
        RAISE NOTICE 'Columna file_config agregada a la tabla opportunity_tech_fields';
    ELSE
        RAISE NOTICE 'La columna file_config ya existe en la tabla opportunity_tech_fields';
    END IF;

    -- Actualizar los registros existentes con una configuración de archivo predeterminada
    UPDATE opportunity_tech_fields
    SET file_config = '{"allowed_types": ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"], "max_size": 5}'::jsonb
    WHERE field_type = 'file' AND file_config IS NULL;

    RAISE NOTICE 'Configuración de archivo predeterminada aplicada a los campos de tipo file existentes';
END $$;

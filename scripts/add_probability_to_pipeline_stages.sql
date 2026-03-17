-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pipeline_stages'
        AND column_name = 'probability'
    ) THEN
        -- Añadir la columna de probabilidad
        ALTER TABLE pipeline_stages ADD COLUMN probability INTEGER;
        
        -- Actualizar las probabilidades por defecto según el orden de visualización
        UPDATE pipeline_stages SET probability = 10 WHERE code = 'lead';
        UPDATE pipeline_stages SET probability = 30 WHERE code = 'opportunity';
        UPDATE pipeline_stages SET probability = 50 WHERE code = 'proposal';
        UPDATE pipeline_stages SET probability = 70 WHERE code = 'negotiation';
        UPDATE pipeline_stages SET probability = 90 WHERE code = 'closing';
        UPDATE pipeline_stages SET probability = 100 WHERE code = 'won';
        UPDATE pipeline_stages SET probability = 0 WHERE code = 'lost';
        
        RAISE NOTICE 'Columna de probabilidad añadida y valores por defecto establecidos';
    ELSE
        RAISE NOTICE 'La columna de probabilidad ya existe';
    END IF;
END $$;

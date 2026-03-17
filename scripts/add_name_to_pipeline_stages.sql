-- Verificar si la columna 'name' ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'pipeline_stages'
        AND column_name = 'name'
    ) THEN
        -- Añadir la columna 'name' si no existe
        ALTER TABLE pipeline_stages ADD COLUMN name TEXT;
        
        -- Actualizar los valores de 'name' basados en 'code'
        UPDATE pipeline_stages SET name = 'Prospección' WHERE code = 'PROSPECTING';
        UPDATE pipeline_stages SET name = 'Calificación' WHERE code = 'QUALIFICATION';
        UPDATE pipeline_stages SET name = 'Propuesta' WHERE code = 'PROPOSAL';
        UPDATE pipeline_stages SET name = 'Negociación' WHERE code = 'NEGOTIATION';
        UPDATE pipeline_stages SET name = 'Cerrada Ganada' WHERE code = 'CLOSED_WON';
        UPDATE pipeline_stages SET name = 'Cerrada Perdida' WHERE code = 'CLOSED_LOST';
    END IF;
END $$;

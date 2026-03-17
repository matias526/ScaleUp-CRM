-- Script para añadir el campo display_order a la tabla opportunity_tech_fields
-- Autor: ScaleUp Support
-- Fecha: 14/05/2025

-- Verificar si la tabla existe
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'opportunity_tech_fields'
    ) THEN
        -- Verificar si el campo ya existe
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'opportunity_tech_fields' 
            AND column_name = 'display_order'
        ) THEN
            -- Añadir el campo display_order
            ALTER TABLE opportunity_tech_fields ADD COLUMN display_order INTEGER;
            
            -- Asignar valores iniciales basados en el ID
            WITH ordered_fields AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num
                FROM opportunity_tech_fields
            )
            UPDATE opportunity_tech_fields otf
            SET display_order = of.row_num * 10
            FROM ordered_fields of
            WHERE otf.id = of.id;
            
            -- Establecer el campo como NOT NULL después de asignar valores
            ALTER TABLE opportunity_tech_fields ALTER COLUMN display_order SET NOT NULL;
            
            -- Añadir un comentario al campo
            COMMENT ON COLUMN opportunity_tech_fields.display_order IS 'Orden de visualización del campo técnico en la interfaz';
            
            -- Crear un índice para mejorar el rendimiento de las consultas que ordenan por este campo
            CREATE INDEX idx_opportunity_tech_fields_display_order ON opportunity_tech_fields(display_order);
            
            RAISE NOTICE 'Campo display_order añadido correctamente a la tabla opportunity_tech_fields';
        ELSE
            RAISE NOTICE 'El campo display_order ya existe en la tabla opportunity_tech_fields';
        END IF;
    ELSE
        RAISE NOTICE 'La tabla opportunity_tech_fields no existe';
    END IF;
END $$;

-- Mostrar la estructura actual de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'opportunity_tech_fields'
ORDER BY 
    ordinal_position;

-- Mostrar los primeros 10 registros con el nuevo campo
SELECT 
    id, 
    name, 
    type, 
    display_order
FROM 
    opportunity_tech_fields
ORDER BY 
    display_order
LIMIT 10;

-- Verificar si hay registros sin valor en display_order
SELECT 
    COUNT(*) as registros_sin_display_order
FROM 
    opportunity_tech_fields
WHERE 
    display_order IS NULL;

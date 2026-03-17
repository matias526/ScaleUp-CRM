-- Verificar si la extensión de almacenamiento está habilitada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
    ) THEN
        RAISE NOTICE 'La extensión pg_net no está habilitada. Algunas operaciones de almacenamiento pueden no funcionar correctamente.';
    END IF;
END $$;

-- Crear el bucket para archivos de oportunidades si no existe
SELECT create_bucket_if_not_exists('opportunity_files', 'Archivos adjuntos a oportunidades');

-- Establecer la política de acceso público para el bucket
BEGIN;
    -- Eliminar políticas existentes para evitar conflictos
    DROP POLICY IF EXISTS "Acceso público a archivos de oportunidades" ON storage.objects;
    
    -- Crear política para permitir acceso público de lectura
    CREATE POLICY "Acceso público a archivos de oportunidades"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'opportunity_files');
    
    -- Crear política para permitir a usuarios autenticados subir archivos
    DROP POLICY IF EXISTS "Permitir carga de archivos a usuarios autenticados" ON storage.objects;
    CREATE POLICY "Permitir carga de archivos a usuarios autenticados"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'opportunity_files');
    
    -- Crear política para permitir a usuarios autenticados actualizar sus propios archivos
    DROP POLICY IF EXISTS "Permitir actualización de archivos a usuarios autenticados" ON storage.objects;
    CREATE POLICY "Permitir actualización de archivos a usuarios autenticados"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'opportunity_files');
    
    -- Crear política para permitir a usuarios autenticados eliminar sus propios archivos
    DROP POLICY IF EXISTS "Permitir eliminación de archivos a usuarios autenticados" ON storage.objects;
    CREATE POLICY "Permitir eliminación de archivos a usuarios autenticados"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'opportunity_files');
COMMIT;

-- Función auxiliar para crear bucket si no existe
CREATE OR REPLACE FUNCTION create_bucket_if_not_exists(
    bucket_name TEXT,
    bucket_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    -- Verificar si el bucket ya existe
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = bucket_name
    ) INTO bucket_exists;
    
    -- Si no existe, crearlo
    IF NOT bucket_exists THEN
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
        VALUES (bucket_name, bucket_name, TRUE, FALSE, 52428800, NULL); -- 50MB limit
        
        RAISE NOTICE 'Bucket "%" creado exitosamente', bucket_name;
    ELSE
        RAISE NOTICE 'El bucket "%" ya existe', bucket_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

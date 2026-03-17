-- Versión alternativa para configurar políticas del bucket profile-images
-- Usando la sintaxis más reciente de Supabase

-- Política para permitir lectura pública
DO $$
BEGIN
    EXECUTE format('
        CREATE POLICY "Public Read Policy" ON storage.objects
        FOR SELECT
        USING (bucket_id = ''profile-images'')
    ');
    RAISE NOTICE 'Política de lectura pública creada';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error o política ya existe: %', SQLERRM;
END $$;

-- Política para permitir a usuarios autenticados subir imágenes
DO $$
BEGIN
    EXECUTE format('
        CREATE POLICY "Auth Insert Policy" ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = ''profile-images'')
    ');
    RAISE NOTICE 'Política de inserción creada';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error o política ya existe: %', SQLERRM;
END $$;

-- Política para permitir a usuarios autenticados actualizar imágenes
DO $$
BEGIN
    EXECUTE format('
        CREATE POLICY "Auth Update Policy" ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = ''profile-images'')
    ');
    RAISE NOTICE 'Política de actualización creada';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error o política ya existe: %', SQLERRM;
END $$;

-- Política para permitir a usuarios autenticados eliminar imágenes
DO $$
BEGIN
    EXECUTE format('
        CREATE POLICY "Auth Delete Policy" ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = ''profile-images'')
    ');
    RAISE NOTICE 'Política de eliminación creada';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error o política ya existe: %', SQLERRM;
END $$;

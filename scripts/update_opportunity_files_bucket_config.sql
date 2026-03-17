-- Verificar si el bucket existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'opportunity_files'
    ) THEN
        RAISE EXCEPTION 'El bucket opportunity_files no existe. Créelo primero.';
    END IF;
END $$;

-- Actualizar la configuración del bucket para establecer límites de tamaño
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB en bytes
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
        'application/zip',
        'application/x-rar-compressed'
    ]
WHERE name = 'opportunity_files';

-- Verificar que la actualización se realizó correctamente
DO $$
DECLARE
    bucket_config RECORD;
BEGIN
    SELECT file_size_limit, allowed_mime_types 
    INTO bucket_config 
    FROM storage.buckets 
    WHERE name = 'opportunity_files';
    
    RAISE NOTICE 'Configuración actualizada: Límite de tamaño = % bytes, Tipos MIME permitidos = %', 
        bucket_config.file_size_limit, 
        bucket_config.allowed_mime_types;
END $$;

-- Actualizar o crear políticas de seguridad para el bucket
-- Política para SELECT (leer archivos)
DROP POLICY IF EXISTS "Cualquiera puede leer archivos 1" ON storage.objects;
CREATE POLICY "Cualquiera puede leer archivos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'opportunity_files');

-- Política para INSERT (subir archivos) - Solo usuarios autenticados
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos 1" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir archivos" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'opportunity_files' 
    AND auth.role() = 'authenticated'
);

-- Política para UPDATE (actualizar archivos) - Solo el propietario o administradores
DROP POLICY IF EXISTS "Solo propietarios pueden actualizar archivos 1" ON storage.objects;
CREATE POLICY "Solo propietarios pueden actualizar archivos" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'opportunity_files' 
    AND (auth.uid() = owner OR auth.role() = 'service_role')
)
WITH CHECK (
    bucket_id = 'opportunity_files' 
    AND (auth.uid() = owner OR auth.role() = 'service_role')
);

-- Política para DELETE (eliminar archivos) - Solo el propietario o administradores
DROP POLICY IF EXISTS "Solo propietarios pueden eliminar archivos 1" ON storage.objects;
CREATE POLICY "Solo propietarios pueden eliminar archivos" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'opportunity_files' 
    AND (auth.uid() = owner OR auth.role() = 'service_role')
);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Configuración de seguridad actualizada para el bucket opportunity_files';
END $$;

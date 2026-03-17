-- Versión simplificada para configurar políticas del bucket profile-images

-- Política para permitir lectura pública
CREATE POLICY "Public Read Policy" ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

-- Política para permitir a usuarios autenticados subir imágenes
CREATE POLICY "Auth Insert Policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Política para permitir a usuarios autenticados actualizar imágenes
CREATE POLICY "Auth Update Policy" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images');

-- Política para permitir a usuarios autenticados eliminar imágenes
CREATE POLICY "Auth Delete Policy" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

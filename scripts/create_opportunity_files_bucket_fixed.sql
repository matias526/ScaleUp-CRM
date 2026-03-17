-- Script corregido para crear el bucket opportunity_files
BEGIN;
  -- Intentar crear el bucket directamente
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('opportunity_files', 'opportunity_files', true)
  ON CONFLICT (id) DO NOTHING;

  -- Configurar políticas de acceso correctamente
  -- Política para lectura pública (solo USING para SELECT)
  DROP POLICY IF EXISTS "Lectura pública de archivos de oportunidades" ON storage.objects;
  CREATE POLICY "Lectura pública de archivos de oportunidades" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'opportunity_files');

  -- Política para permitir a usuarios autenticados subir archivos (solo WITH CHECK para INSERT)
  DROP POLICY IF EXISTS "Permitir carga de archivos a usuarios autenticados" ON storage.objects;
  CREATE POLICY "Permitir carga de archivos a usuarios autenticados" 
  ON storage.objects FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'opportunity_files');

  -- Política para permitir a usuarios autenticados actualizar archivos (USING y WITH CHECK para UPDATE)
  DROP POLICY IF EXISTS "Permitir actualización de archivos a usuarios autenticados" ON storage.objects;
  CREATE POLICY "Permitir actualización de archivos a usuarios autenticados" 
  ON storage.objects FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'opportunity_files')
  WITH CHECK (bucket_id = 'opportunity_files');

  -- Política para permitir a usuarios autenticados eliminar archivos (solo USING para DELETE)
  DROP POLICY IF EXISTS "Permitir eliminación de archivos a usuarios autenticados" ON storage.objects;
  CREATE POLICY "Permitir eliminación de archivos a usuarios autenticados" 
  ON storage.objects FOR DELETE 
  TO authenticated
  USING (bucket_id = 'opportunity_files');
COMMIT;

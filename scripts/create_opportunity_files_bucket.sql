-- Script simplificado para crear el bucket opportunity_files
BEGIN;
  -- Intentar crear el bucket directamente
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('opportunity_files', 'opportunity_files', true)
  ON CONFLICT (id) DO NOTHING;

  -- Configurar políticas de acceso
  -- Política para lectura pública
  CREATE POLICY "Lectura pública de archivos de oportunidades" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'opportunity_files')
  WITH CHECK (bucket_id = 'opportunity_files');

  -- Política para permitir a usuarios autenticados subir archivos
  CREATE POLICY "Permitir carga de archivos a usuarios autenticados" 
  ON storage.objects FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'opportunity_files');

  -- Política para permitir a usuarios autenticados actualizar archivos
  CREATE POLICY "Permitir actualización de archivos a usuarios autenticados" 
  ON storage.objects FOR UPDATE 
  TO authenticated
  USING (bucket_id = 'opportunity_files');

  -- Política para permitir a usuarios autenticados eliminar archivos
  CREATE POLICY "Permitir eliminación de archivos a usuarios autenticados" 
  ON storage.objects FOR DELETE 
  TO authenticated
  USING (bucket_id = 'opportunity_files');
COMMIT;

-- Crear un bucket para los logos de los partners
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner_logos', 'partner_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Crear políticas de acceso público para los logos de partners
DO $$
BEGIN
    -- Verificar si la política ya existe antes de crearla
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Logos de partners accesibles públicamente'
    ) THEN
        EXECUTE 'CREATE POLICY "Logos de partners accesibles públicamente" ON storage.objects FOR SELECT USING (bucket_id = ''partner_logos'')';
    END IF;
    
    -- Política para permitir a usuarios autenticados subir logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Usuarios autenticados pueden subir logos de partners'
    ) THEN
        EXECUTE 'CREATE POLICY "Usuarios autenticados pueden subir logos de partners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''partner_logos'')';
    END IF;
    
    -- Política para permitir a usuarios autenticados actualizar sus propios logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Usuarios autenticados pueden actualizar logos de partners'
    ) THEN
        EXECUTE 'CREATE POLICY "Usuarios autenticados pueden actualizar logos de partners" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''partner_logos'' AND owner = auth.uid())';
    END IF;
    
    -- Política para permitir a usuarios autenticados eliminar sus propios logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Usuarios autenticados pueden eliminar logos de partners'
    ) THEN
        EXECUTE 'CREATE POLICY "Usuarios autenticados pueden eliminar logos de partners" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''partner_logos'' AND owner = auth.uid())';
    END IF;
END $$;

-- Verificar que la extensión de almacenamiento esté habilitada
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Crear un bucket para los logos de las empresas tecnológicas si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('tech_company_logos', 'tech_company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Crear políticas de acceso público para los logos
DO $$
BEGIN
    -- Verificar si la política ya existe antes de crearla
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Logos accesibles públicamente'
    ) THEN
        EXECUTE 'CREATE POLICY "Logos accesibles públicamente" ON storage.objects FOR SELECT USING (bucket_id = ''tech_company_logos'')';
    END IF;
    
    -- Política para permitir a usuarios autenticados subir logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Usuarios autenticados pueden subir logos'
    ) THEN
        EXECUTE 'CREATE POLICY "Usuarios autenticados pueden subir logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''tech_company_logos'')';
    END IF;
    
    -- Política para permitir a usuarios autenticados actualizar sus propios logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Usuarios autenticados pueden actualizar sus propios logos'
    ) THEN
        EXECUTE 'CREATE POLICY "Usuarios autenticados pueden actualizar sus propios logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''tech_company_logos'' AND owner = auth.uid())';
    END IF;
    
    -- Política para permitir a usuarios autenticados eliminar sus propios logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Usuarios autenticados pueden eliminar sus propios logos'
    ) THEN
        EXECUTE 'CREATE POLICY "Usuarios autenticados pueden eliminar sus propios logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''tech_company_logos'' AND owner = auth.uid())';
    END IF;
END $$;

-- Verificar que la estructura de la tabla tech_companies es correcta
DO $$
BEGIN
    -- Verificar que el campo logo_url existe y es del tipo correcto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tech_companies' 
        AND column_name = 'logo_url'
    ) THEN
        RAISE EXCEPTION 'El campo logo_url no existe en la tabla tech_companies';
    END IF;
    
    -- Verificar que el campo logo_url es de tipo VARCHAR
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tech_companies' 
        AND column_name = 'logo_url'
        AND data_type = 'character varying'
    ) THEN
        RAISE EXCEPTION 'El campo logo_url no es de tipo VARCHAR';
    END IF;
END $$;

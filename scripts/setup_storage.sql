-- Crear un bucket para los logos de las empresas tecnológicas
INSERT INTO storage.buckets (id, name, public)
VALUES ('tech_company_logos', 'tech_company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Crear políticas de acceso público para los logos
CREATE POLICY "Logos accesibles públicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'tech_company_logos');

-- Crear política para permitir a usuarios autenticados subir logos
CREATE POLICY "Usuarios autenticados pueden subir logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tech_company_logos');

-- Crear política para permitir a usuarios autenticados actualizar sus propios logos
CREATE POLICY "Usuarios autenticados pueden actualizar sus propios logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tech_company_logos' AND owner = auth.uid());

-- Crear política para permitir a usuarios autenticados eliminar sus propios logos
CREATE POLICY "Usuarios autenticados pueden eliminar sus propios logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tech_company_logos' AND owner = auth.uid());

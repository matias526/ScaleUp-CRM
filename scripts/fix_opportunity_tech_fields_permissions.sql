-- Verificar si existen políticas RLS para opportunity_tech_fields
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'opportunity_tech_fields';

-- Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'opportunity_tech_fields';

-- Habilitar RLS si no está habilitado
ALTER TABLE opportunity_tech_fields ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir INSERT a usuarios autenticados
DROP POLICY IF EXISTS "Users can insert opportunity tech fields" ON opportunity_tech_fields;
CREATE POLICY "Users can insert opportunity tech fields" 
ON opportunity_tech_fields FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Crear política para permitir SELECT a usuarios autenticados
DROP POLICY IF EXISTS "Users can view opportunity tech fields" ON opportunity_tech_fields;
CREATE POLICY "Users can view opportunity tech fields" 
ON opportunity_tech_fields FOR SELECT 
TO authenticated 
USING (true);

-- Crear política para permitir UPDATE a usuarios autenticados
DROP POLICY IF EXISTS "Users can update opportunity tech fields" ON opportunity_tech_fields;
CREATE POLICY "Users can update opportunity tech fields" 
ON opportunity_tech_fields FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Crear política para permitir DELETE a usuarios autenticados
DROP POLICY IF EXISTS "Users can delete opportunity tech fields" ON opportunity_tech_fields;
CREATE POLICY "Users can delete opportunity tech fields" 
ON opportunity_tech_fields FOR DELETE 
TO authenticated 
USING (true);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'opportunity_tech_fields';

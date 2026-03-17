-- Verificar si la tabla existe y tiene datos
SELECT 
    'Table exists' as status,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_records
FROM public.industries;

-- Mostrar todos los registros
SELECT * FROM public.industries ORDER BY display_order, name;

-- Verificar permisos RLS
SELECT schemaname, tablename, rowsecurity, hasrls 
FROM pg_tables 
WHERE tablename = 'industries';

-- Verificar políticas RLS si existen
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'industries';

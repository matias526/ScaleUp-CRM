-- Script para diagnosticar la configuración de reportes semanales

-- 1. Verificar si existe la tabla weekly_report_recipients
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'weekly_report_recipients'
) as table_exists;

-- 2. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'weekly_report_recipients'
ORDER BY ordinal_position;

-- 3. Contar registros totales
SELECT COUNT(*) as total_recipients FROM weekly_report_recipients;

-- 4. Contar registros activos
SELECT COUNT(*) as active_recipients FROM weekly_report_recipients WHERE is_active = true;

-- 5. Ver todos los registros con detalles
SELECT 
    wrr.id,
    wrr.tech_company_id,
    wrr.user_id,
    wrr.is_active,
    wrr.preferred_language,
    tc.name as tech_company_name,
    u.email as user_email,
    u.first_name,
    u.last_name
FROM weekly_report_recipients wrr
LEFT JOIN tech_companies tc ON wrr.tech_company_id = tc.id
LEFT JOIN users u ON wrr.user_id = u.user_id
ORDER BY wrr.created_at DESC;

-- 6. Verificar tech companies disponibles
SELECT id, name FROM tech_companies ORDER BY name;

-- 7. Verificar usuarios disponibles
SELECT id, email, first_name, last_name FROM users ORDER BY first_name;

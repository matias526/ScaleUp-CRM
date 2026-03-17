-- Script para crear destinatarios de ejemplo si no existen
-- Solo ejecutar si necesitas datos de prueba

-- Verificar si ya existen destinatarios
DO $$
BEGIN
    -- Solo insertar si no hay destinatarios
    IF (SELECT COUNT(*) FROM weekly_report_recipients) = 0 THEN
        -- Insertar destinatarios de ejemplo
        -- Nota: Ajusta los IDs según tu base de datos real
        
        INSERT INTO weekly_report_recipients (tech_company_id, user_id, is_active, preferred_language)
        SELECT 
            tc.id as tech_company_id,
            u.id as user_id,
            true as is_active,
            'es' as preferred_language
        FROM tech_companies tc
        CROSS JOIN users u
        WHERE tc.name ILIKE '%microsoft%' OR tc.name ILIKE '%google%' OR tc.name ILIKE '%amazon%'
        LIMIT 3;
        
        RAISE NOTICE 'Destinatarios de ejemplo creados';
    ELSE
        RAISE NOTICE 'Ya existen % destinatarios configurados', (SELECT COUNT(*) FROM weekly_report_recipients);
    END IF;
END $$;

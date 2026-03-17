-- Verificar si hay partners y países
DO $$
DECLARE
    partner_count INTEGER;
    country_count INTEGER;
    first_partner_id UUID;
    country_ids UUID[];
BEGIN
    -- Contar partners
    SELECT COUNT(*) INTO partner_count FROM partners;
    
    -- Contar países
    SELECT COUNT(*) INTO country_count FROM countries;
    
    RAISE NOTICE 'Hay % partners y % países', partner_count, country_count;
    
    -- Si hay partners y países pero no hay relaciones, crear algunas de prueba
    IF partner_count > 0 AND country_count > 0 THEN
        -- Verificar si ya hay relaciones
        DECLARE relation_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO relation_count FROM partner_countries;
            
            IF relation_count = 0 THEN
                -- Obtener el primer partner
                SELECT id INTO first_partner_id FROM partners LIMIT 1;
                
                -- Obtener algunos países (hasta 5)
                SELECT array_agg(id) INTO country_ids FROM countries LIMIT 5;
                
                -- Insertar relaciones
                IF first_partner_id IS NOT NULL AND country_ids IS NOT NULL THEN
                    RAISE NOTICE 'Insertando relaciones para el partner %', first_partner_id;
                    
                    FOR i IN 1..array_length(country_ids, 1) LOOP
                        INSERT INTO partner_countries (partner_id, country_id)
                        VALUES (first_partner_id, country_ids[i]);
                        
                        RAISE NOTICE 'Relación creada con país %', country_ids[i];
                    END LOOP;
                END IF;
            ELSE
                RAISE NOTICE 'Ya existen % relaciones entre partners y países', relation_count;
            END IF;
        END;
    END IF;
END $$;

-- Mostrar las relaciones existentes
SELECT 
    pc.partner_id, 
    p.name as partner_name,
    pc.country_id, 
    c.name as country_name,
    c.code as country_code
FROM 
    partner_countries pc
JOIN 
    partners p ON pc.partner_id = p.id
JOIN 
    countries c ON pc.country_id = c.id
ORDER BY 
    p.name, 
    c.name;

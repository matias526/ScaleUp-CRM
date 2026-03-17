-- Verificar si existe la tabla pipeline_stages
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'pipeline_stages'
);

-- Ver la estructura de la tabla
\d pipeline_stages;

-- Ver todos los registros
SELECT * FROM pipeline_stages ORDER BY display_order;

-- Contar registros
SELECT COUNT(*) as total_stages FROM pipeline_stages;

-- Ver si hay registros activos
SELECT * FROM pipeline_stages WHERE is_active = true ORDER BY display_order;

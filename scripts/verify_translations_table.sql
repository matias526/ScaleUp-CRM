-- Verificar la estructura de la tabla de traducciones
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'translations' 
ORDER BY 
  ordinal_position;

-- Contar registros por idioma
SELECT 
  language, 
  COUNT(*) as total_translations 
FROM 
  translations 
GROUP BY 
  language 
ORDER BY 
  total_translations DESC;

-- Verificar si hay claves duplicadas
SELECT 
  key, 
  language, 
  COUNT(*) as occurrences 
FROM 
  translations 
GROUP BY 
  key, 
  language 
HAVING 
  COUNT(*) > 1;

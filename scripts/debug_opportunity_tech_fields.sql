-- Script para depurar la configuración de campos técnicos
SELECT 
  id,
  tech_company_id,
  field_name,
  field_type,
  is_required,
  file_config,
  created_at,
  updated_at
FROM opportunity_tech_fields
WHERE field_type = 'file'
ORDER BY tech_company_id, field_name;

-- Verificar si hay campos con configuración de archivo
SELECT 
  id,
  tech_company_id,
  field_name,
  field_type,
  file_config
FROM opportunity_tech_fields
WHERE field_type = 'file' AND file_config IS NOT NULL;

-- Verificar la estructura de la configuración de archivo
SELECT 
  id,
  field_name,
  file_config->>'max_size_mb' as max_size_mb,
  file_config->>'allowed_mime_types' as allowed_mime_types
FROM opportunity_tech_fields
WHERE field_type = 'file' AND file_config IS NOT NULL;

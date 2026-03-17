-- Verificar la estructura de la tabla opportunity_tech_values
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'opportunity_tech_values';

-- Verificar si hay valores guardados
SELECT 
  count(*) as total_values,
  count(value_text) as text_values,
  count(value_numeric) as numeric_values,
  count(value_boolean) as boolean_values,
  count(value_date) as date_values,
  count(value_json) as json_values,
  count(value) as legacy_values
FROM 
  opportunity_tech_values;

-- Verificar valores por tipo de campo
WITH field_types AS (
  SELECT 
    id, 
    field_name,
    field_type
  FROM 
    opportunity_tech_fields
)
SELECT 
  ft.field_type,
  count(otv.*) as value_count,
  count(otv.value_text) as text_values,
  count(otv.value_numeric) as numeric_values,
  count(otv.value_boolean) as boolean_values,
  count(otv.value_date) as date_values,
  count(otv.value_json) as json_values
FROM 
  opportunity_tech_values otv
JOIN 
  field_types ft ON otv.opportunity_tech_field_id = ft.id
GROUP BY 
  ft.field_type;

-- Verificar valores nulos o vacíos
SELECT 
  otf.field_name,
  otf.field_type,
  count(otv.*) as total_values,
  count(*) FILTER (WHERE 
    otv.value_text IS NULL AND 
    otv.value_numeric IS NULL AND 
    otv.value_boolean IS NULL AND 
    otv.value_date IS NULL AND 
    otv.value_json IS NULL AND
    otv.value IS NULL
  ) as empty_values
FROM 
  opportunity_tech_values otv
JOIN 
  opportunity_tech_fields otf ON otv.opportunity_tech_field_id = otf.id
GROUP BY 
  otf.field_name, otf.field_type
HAVING 
  count(*) FILTER (WHERE 
    otv.value_text IS NULL AND 
    otv.value_numeric IS NULL AND 
    otv.value_boolean IS NULL AND 
    otv.value_date IS NULL AND 
    otv.value_json IS NULL AND
    otv.value IS NULL
  ) > 0;

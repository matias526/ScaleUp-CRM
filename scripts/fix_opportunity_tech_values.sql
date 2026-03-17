-- Corregir valores que podrían estar en la columna incorrecta

-- 1. Mover valores de la columna legacy 'value' a las columnas específicas
WITH updates AS (
  SELECT 
    otv.id,
    otf.field_type,
    otv.value
  FROM 
    opportunity_tech_values otv
  JOIN 
    opportunity_tech_fields otf ON otv.opportunity_tech_field_id = otf.id
  WHERE 
    otv.value IS NOT NULL AND
    (
      (otf.field_type IN ('text', 'select', 'file') AND otv.value_text IS NULL) OR
      (otf.field_type = 'number' AND otv.value_numeric IS NULL) OR
      (otf.field_type = 'boolean' AND otv.value_boolean IS NULL) OR
      (otf.field_type = 'date' AND otv.value_date IS NULL) OR
      (otf.field_type = 'multiselect' AND otv.value_json IS NULL)
    )
)
UPDATE opportunity_tech_values otv
SET 
  value_text = CASE 
    WHEN u.field_type IN ('text', 'select', 'file') THEN u.value
    ELSE otv.value_text
  END,
  value_numeric = CASE 
    WHEN u.field_type = 'number' AND u.value ~ '^[0-9]+(\.[0-9]+)?$' THEN u.value::numeric
    ELSE otv.value_numeric
  END,
  value_boolean = CASE 
    WHEN u.field_type = 'boolean' THEN 
      CASE 
        WHEN lower(u.value) IN ('true', 't', 'yes', 'y', '1') THEN true
        WHEN lower(u.value) IN ('false', 'f', 'no', 'n', '0') THEN false
        ELSE otv.value_boolean
      END
    ELSE otv.value_boolean
  END,
  value_date = CASE 
    WHEN u.field_type = 'date' AND u.value ~ '^\d{4}-\d{2}-\d{2}' THEN u.value::date
    ELSE otv.value_date
  END,
  value_json = CASE 
    WHEN u.field_type = 'multiselect' AND u.value ~ '^\[.*\]$' THEN u.value::jsonb
    ELSE otv.value_json
  END
FROM updates u
WHERE otv.id = u.id;

-- Mostrar un resumen de los valores actualizados
SELECT 'Valores corregidos' as message;

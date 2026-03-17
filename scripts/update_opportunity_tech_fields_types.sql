-- Verificar si la columna field_type tiene una restricción CHECK
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT c.conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'opportunity_tech_fields'
    AND a.attname = 'field_type'
    AND c.contype = 'c';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE opportunity_tech_fields DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Restricción % eliminada', constraint_name;
    ELSE
        RAISE NOTICE 'No se encontró restricción CHECK para la columna field_type';
    END IF;
END $$;

-- Agregar la nueva restricción con los tipos adicionales
ALTER TABLE opportunity_tech_fields
ADD CONSTRAINT opportunity_tech_fields_field_type_check
CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'file'));

-- Verificar que la restricción se haya aplicado correctamente
DO $$
BEGIN
    RAISE NOTICE 'Restricción actualizada para incluir multiselect y file';
END $$;

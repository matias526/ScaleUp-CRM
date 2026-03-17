-- Crear función para verificar si existe una columna en una tabla
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS TABLE(exists boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = column_exists.table_name
        AND column_name = column_exists.column_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

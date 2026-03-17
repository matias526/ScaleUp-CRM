-- Función para verificar si existe una tabla
CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS TABLE(exists BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

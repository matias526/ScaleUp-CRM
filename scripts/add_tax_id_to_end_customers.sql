-- Verificar si la columna ya existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'end_customers'
    AND column_name = 'tax_id'
  ) THEN
    -- Agregar la columna tax_id
    ALTER TABLE public.end_customers
    ADD COLUMN tax_id character varying(50) NULL;
    
    -- Comentario para documentación
    COMMENT ON COLUMN public.end_customers.tax_id IS 'Identificador fiscal del cliente final (NIF, CIF, RFC, etc.)';
  END IF;
END
$$;

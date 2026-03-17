-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notes'
        AND column_name = 'is_private'
    ) THEN
        -- Agregar la columna is_private con valor predeterminado false
        ALTER TABLE public.notes ADD COLUMN is_private BOOLEAN DEFAULT false;
        
        -- Comentario para la columna
        COMMENT ON COLUMN public.notes.is_private IS 'Indica si la nota es privada (solo visible para usuarios de ScaleUp)';
    END IF;
END
$$;

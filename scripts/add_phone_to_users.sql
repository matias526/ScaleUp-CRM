-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'phone'
    ) THEN
        -- Agregar la columna phone a la tabla users
        ALTER TABLE public.users ADD COLUMN phone VARCHAR(50);
        
        -- Agregar un comentario a la columna
        COMMENT ON COLUMN public.users.phone IS 'Número de teléfono del usuario';
    ELSE
        RAISE NOTICE 'La columna phone ya existe en la tabla users';
    END IF;
END $$;

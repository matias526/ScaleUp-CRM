-- Agregar la columna profile_image a la tabla users si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'profile_image'
    ) THEN
        ALTER TABLE public.users ADD COLUMN profile_image TEXT;
        RAISE NOTICE 'Columna profile_image agregada a la tabla users';
    ELSE
        RAISE NOTICE 'La columna profile_image ya existe en la tabla users';
    END IF;
END $$;

-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'profile_image'
    ) THEN
        -- Agregar la columna profile_image
        ALTER TABLE public.users
        ADD COLUMN profile_image TEXT;
        
        RAISE NOTICE 'Columna profile_image agregada a la tabla users';
    ELSE
        RAISE NOTICE 'La columna profile_image ya existe en la tabla users';
    END IF;
END $$;

-- Crear el bucket para las imágenes de perfil si no existe
DO $$
BEGIN
    -- Verificar si el bucket ya existe
    IF NOT EXISTS (
        SELECT 1
        FROM storage.buckets
        WHERE name = 'profile-images'
    ) THEN
        -- Crear el bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('profile-images', 'profile-images', true);
        
        RAISE NOTICE 'Bucket profile-images creado';
    ELSE
        RAISE NOTICE 'El bucket profile-images ya existe';
    END IF;
END $$;

-- Configurar políticas de acceso para el bucket de imágenes de perfil
DO $$
BEGIN
    -- Eliminar políticas existentes para evitar duplicados
    BEGIN
        DELETE FROM storage.policies
        WHERE bucket_id = 'profile-images';
        RAISE NOTICE 'Políticas existentes eliminadas para el bucket profile-images';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error al eliminar políticas existentes: %', SQLERRM;
    END;

    -- Política para permitir a todos los usuarios autenticados leer imágenes de perfil
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'profile-images',
        'Public Read Access',
        'SELECT',
        '(bucket_id = ''profile-images'')'
    );
    RAISE NOTICE 'Política de lectura pública creada para profile-images';

    -- Política para permitir a los usuarios autenticados subir sus propias imágenes de perfil
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'profile-images',
        'Auth Insert Access',
        'INSERT',
        '(bucket_id = ''profile-images'' AND auth.role() = ''authenticated'')'
    );
    RAISE NOTICE 'Política de inserción para usuarios autenticados creada para profile-images';

    -- Política para permitir a los usuarios autenticados actualizar sus propias imágenes de perfil
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'profile-images',
        'Auth Update Access',
        'UPDATE',
        '(bucket_id = ''profile-images'' AND auth.role() = ''authenticated'')'
    );
    RAISE NOTICE 'Política de actualización para usuarios autenticados creada para profile-images';

    -- Política para permitir a los usuarios autenticados eliminar sus propias imágenes de perfil
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'profile-images',
        'Auth Delete Access',
        'DELETE',
        '(bucket_id = ''profile-images'' AND auth.role() = ''authenticated'')'
    );
    RAISE NOTICE 'Política de eliminación para usuarios autenticados creada para profile-images';
END $$;

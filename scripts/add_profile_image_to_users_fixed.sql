-- Verificar si la columna ya existe y agregarla si no existe
BEGIN;

-- Agregar la columna profile_image si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'profile_image'
    ) THEN
        ALTER TABLE public.users
        ADD COLUMN profile_image TEXT;
        
        RAISE NOTICE 'Columna profile_image agregada a la tabla users';
    ELSE
        RAISE NOTICE 'La columna profile_image ya existe en la tabla users';
    END IF;
END $$;

COMMIT;

-- Crear el bucket para las imágenes de perfil
BEGIN;

-- Verificar si el bucket ya existe antes de crearlo
DO $$
BEGIN
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

COMMIT;

-- Configurar políticas de acceso para el bucket
BEGIN;

-- Eliminar políticas existentes para evitar duplicados
DO $$
BEGIN
    DELETE FROM storage.policies
    WHERE bucket_id = 'profile-images';
    EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No hay políticas previas para eliminar o error: %', SQLERRM;
END $$;

-- Crear políticas una por una con manejo de errores
DO $$
BEGIN
    -- Política para permitir lectura pública
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'profile-images',
        'Public Read Access',
        'SELECT',
        'true'
    );
    EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política de lectura: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Política para permitir a usuarios autenticados subir imágenes
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'profile-images',
        'Auth Insert Access',
        'INSERT',
        'auth.role() = ''authenticated'''
    );
    EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política de inserción: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Política para permitir a usuarios autenticados actualizar imágenes
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'profile-images',
        'Auth Update Access',
        'UPDATE',
        'auth.role() = ''authenticated'''
    );
    EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política de actualización: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Política para permitir a usuarios autenticados eliminar imágenes
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES (
        'profile-images',
        'Auth Delete Access',
        'DELETE',
        'auth.role() = ''authenticated'''
    );
    EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política de eliminación: %', SQLERRM;
END $$;

COMMIT;

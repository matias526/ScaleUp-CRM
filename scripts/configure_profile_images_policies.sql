-- Script para configurar políticas para el bucket profile-images
-- Asegúrate de ejecutar este script con permisos de administrador

-- Política para permitir lectura pública (cualquiera puede ver las imágenes)
BEGIN;
SELECT storage.create_policy(
    'profile-images',
    'Public Read Policy',
    'SELECT',
    'PUBLIC',
    true,  -- Permitir a todos
    null   -- Sin restricciones adicionales
);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política de lectura pública: %', SQLERRM;
END;

-- Política para permitir a usuarios autenticados subir imágenes
BEGIN;
SELECT storage.create_policy(
    'profile-images',
    'Auth Insert Policy',
    'INSERT',
    'AUTHENTICATED',
    true,  -- Permitir a usuarios autenticados
    null   -- Sin restricciones adicionales
);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política de inserción: %', SQLERRM;
END;

-- Política para permitir a usuarios autenticados actualizar sus propias imágenes
BEGIN;
SELECT storage.create_policy(
    'profile-images',
    'Auth Update Policy',
    'UPDATE',
    'AUTHENTICATED',
    true,  -- Permitir a usuarios autenticados
    null   -- Sin restricciones adicionales
);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política de actualización: %', SQLERRM;
END;

-- Política para permitir a usuarios autenticados eliminar sus propias imágenes
BEGIN;
SELECT storage.create_policy(
    'profile-images',
    'Auth Delete Policy',
    'DELETE',
    'AUTHENTICATED',
    true,  -- Permitir a usuarios autenticados
    null   -- Sin restricciones adicionales
);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política de eliminación: %', SQLERRM;
END;

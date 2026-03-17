-- Script simplificado para agregar campo de imagen de perfil
-- Paso 1: Agregar la columna a la tabla users
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Paso 2: Crear el bucket para imágenes de perfil (ejecutar con permisos de administrador)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Paso 3: Crear política básica de lectura pública
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES ('profile-images', 'Public Read', 'SELECT', 'true')
ON CONFLICT (bucket_id, name) DO NOTHING;

-- Paso 4: Crear política básica para permitir subidas a usuarios autenticados
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES ('profile-images', 'Auth Insert', 'INSERT', 'auth.role() = ''authenticated''')
ON CONFLICT (bucket_id, name) DO NOTHING;

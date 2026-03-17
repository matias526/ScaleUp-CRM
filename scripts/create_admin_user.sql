-- Primero, asegúrate de que el rol de Admin existe
DO $$
DECLARE
    admin_role_id UUID;
BEGIN
    -- Obtener el ID del rol Admin
    SELECT id INTO admin_role_id FROM roles WHERE code = 'Admin';
    
    -- Si no existe el rol Admin, mostrar un error
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'El rol Admin no existe. Ejecuta primero el script de creación de tablas.';
    END IF;
    
    -- Insertar el usuario administrador en la tabla users
    -- Nota: El ID debe coincidir con el UUID del usuario en Supabase Auth
    -- Reemplaza 'ID_DEL_USUARIO_EN_SUPABASE_AUTH' con el ID real después de crear el usuario en Supabase Auth
    INSERT INTO users (
        id,
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        preferred_language
    ) VALUES (
        'ID_DEL_USUARIO_EN_SUPABASE_AUTH', -- Reemplazar con el ID real
        'admin@scaleup.com', -- Reemplazar con el email real
        'Admin',
        'ScaleUp',
        admin_role_id,
        TRUE,
        'es'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Usuario administrador creado correctamente.';
END $$;

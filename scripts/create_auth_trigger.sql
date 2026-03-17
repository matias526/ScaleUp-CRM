-- Crear una función que se ejecutará cuando se cree un nuevo usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Obtener el ID del rol por defecto (Admin para el primer usuario, luego otro rol)
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        -- Si es el primer usuario, asignar rol Admin
        SELECT id INTO default_role_id FROM roles WHERE code = 'Admin';
    ELSE
        -- Para usuarios posteriores, asignar otro rol (por ejemplo, PartnerUser)
        SELECT id INTO default_role_id FROM roles WHERE code = 'PartnerUser';
    END IF;
    
    -- Si no se encuentra ningún rol, usar el primero disponible
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id FROM roles LIMIT 1;
    END IF;
    
    -- Insertar el nuevo usuario en la tabla users
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        preferred_language
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        default_role_id,
        TRUE,
        'es'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger que ejecutará la función cuando se cree un nuevo usuario
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar los datos del usuario cuando se actualiza en Auth
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET 
        email = NEW.email,
        first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar usuario
CREATE OR REPLACE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

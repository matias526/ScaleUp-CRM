-- Primero verificamos si ya existe un usuario con rol BDD
DO $$
DECLARE
    bdd_role_id uuid;
    test_user_id uuid;
BEGIN
    -- Obtener el ID del rol BDD
    SELECT id INTO bdd_role_id FROM roles WHERE code = 'bdd';
    
    IF bdd_role_id IS NULL THEN
        -- Si no existe el rol BDD, lo creamos
        INSERT INTO roles (code, name)
        VALUES ('bdd', 'Business Development Director')
        RETURNING id INTO bdd_role_id;
    END IF;
    
    -- Verificar si ya existe un usuario de prueba con rol BDD
    SELECT id INTO test_user_id FROM users WHERE email = 'bdd_test@example.com';
    
    IF test_user_id IS NULL THEN
        -- Crear un usuario de prueba con rol BDD
        INSERT INTO users (
            email,
            first_name,
            last_name,
            role_id,
            is_active,
            language
        )
        VALUES (
            'bdd_test@example.com',
            'Test',
            'BDD User',
            bdd_role_id,
            true,
            'es'
        );
        
        RAISE NOTICE 'Usuario BDD de prueba creado con éxito';
    ELSE
        -- Actualizar el rol del usuario existente a BDD
        UPDATE users
        SET role_id = bdd_role_id
        WHERE id = test_user_id;
        
        RAISE NOTICE 'Usuario BDD de prueba actualizado con éxito';
    END IF;
END $$;

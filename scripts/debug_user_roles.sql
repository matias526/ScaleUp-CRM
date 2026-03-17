-- Script para verificar la estructura de la tabla de roles y usuarios
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('roles', 'users')
ORDER BY table_name, ordinal_position;

-- Verificar los roles existentes
SELECT * FROM roles;

-- Verificar usuarios con sus roles
SELECT 
  u.id, 
  u.email, 
  u.role_id, 
  r.id as role_id_from_roles, 
  r.code as role_code,
  r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LIMIT 10;

-- Verificar si hay usuarios con rol BDD
SELECT 
  u.id, 
  u.email, 
  u.role_id, 
  r.code as role_code,
  r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.code = 'bdd';

-- Crear un usuario de prueba con rol BDD si no existe
DO $$
DECLARE
  bdd_role_id uuid;
BEGIN
  -- Obtener el ID del rol BDD
  SELECT id INTO bdd_role_id FROM roles WHERE code = 'bdd';
  
  -- Si no existe el rol BDD, crearlo
  IF bdd_role_id IS NULL THEN
    INSERT INTO roles (code, name) VALUES ('bdd', 'Business Development Director')
    RETURNING id INTO bdd_role_id;
  END IF;
  
  -- Actualizar un usuario existente para tener rol BDD (ajustar el email según sea necesario)
  UPDATE users 
  SET role_id = bdd_role_id
  WHERE email = 'test@example.com' 
  AND role_id IS DISTINCT FROM bdd_role_id;
  
  -- Si no se actualizó ningún usuario, crear uno nuevo
  IF NOT FOUND THEN
    -- Verificar si el usuario ya existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'bdd_test@example.com') THEN
      -- Crear un nuevo usuario con rol BDD
      INSERT INTO users (email, role_id, name)
      VALUES ('bdd_test@example.com', bdd_role_id, 'BDD Test User');
    END IF;
  END IF;
END $$;

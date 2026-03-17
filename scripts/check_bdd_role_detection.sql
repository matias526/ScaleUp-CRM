-- Verificar la estructura de la tabla de roles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roles';

-- Listar todos los roles disponibles
SELECT id, code, name, description
FROM roles
ORDER BY code;

-- Verificar qué usuarios tienen asignado el rol de BDD
SELECT u.id, u.email, u.first_name, u.last_name, r.code as role_code
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.code = 'bdd'
ORDER BY u.first_name, u.last_name;

-- Verificar el rol del usuario específico (reemplazar USER_ID con el ID real)
-- SELECT u.id, u.email, u.first_name, u.last_name, r.code as role_code
-- FROM users u
-- JOIN roles r ON u.role_id = r.id
-- WHERE u.id = 'USER_ID';

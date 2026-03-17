-- Verificar el idioma de los usuarios
SELECT id, email, preferred_language FROM users;

-- Actualizar el idioma de un usuario específico (reemplaza USER_ID con el ID real)
-- UPDATE users SET preferred_language = 'es' WHERE id = 'USER_ID';

-- Actualizar el idioma de todos los usuarios a español
-- UPDATE users SET preferred_language = 'es';

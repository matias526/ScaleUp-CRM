-- Verificar los idiomas configurados para los usuarios
SELECT id, email, preferred_language FROM users;

-- Actualizar todos los usuarios a español si tienen inglés configurado
UPDATE users SET preferred_language = 'es' WHERE preferred_language = 'en';

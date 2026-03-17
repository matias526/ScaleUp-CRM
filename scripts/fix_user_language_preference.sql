-- Verificar la preferencia de idioma actual en la tabla de usuarios
SELECT id, email, preferred_language 
FROM users 
WHERE id = auth.uid();

-- Actualizar la preferencia de idioma a portugués para el usuario actual
UPDATE users 
SET preferred_language = 'pt' 
WHERE id = auth.uid();

-- Verificar que se haya actualizado correctamente
SELECT id, email, preferred_language 
FROM users 
WHERE id = auth.uid();

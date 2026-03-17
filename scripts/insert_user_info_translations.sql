-- Insertar traducciones para el dropdown del usuario
INSERT INTO translations (key, language, value) VALUES
-- Español
('user_info.profile', 'es', 'Perfil'),
('user_info.logout', 'es', 'Cerrar Sesión'),

-- Inglés  
('user_info.profile', 'en', 'Profile'),
('user_info.logout', 'en', 'Logout'),

-- Portugués
('user_info.profile', 'pt', 'Perfil'),
('user_info.logout', 'pt', 'Sair')

ON CONFLICT (key, language) DO UPDATE SET
value = EXCLUDED.value;

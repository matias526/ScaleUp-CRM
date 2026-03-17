-- Insertar traducciones básicas para pruebas
INSERT INTO translations (key, language, value) VALUES
('test.hello', 'es', 'Hola'),
('test.hello', 'en', 'Hello'),
('test.hello', 'pt', 'Olá'),
('test.welcome', 'es', 'Bienvenido'),
('test.welcome', 'en', 'Welcome'),
('test.welcome', 'pt', 'Bem-vindo')
ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;

-- Verificar que se insertaron correctamente
SELECT * FROM translations WHERE key LIKE 'test.%' ORDER BY key, language;

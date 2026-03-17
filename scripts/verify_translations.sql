-- Verificar que la tabla de traducciones existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'translations'
    ) THEN
        RAISE EXCEPTION 'La tabla translations no existe. Ejecuta primero el script de creación de tablas.';
    END IF;
END $$;

-- Contar las traducciones por idioma
SELECT language, COUNT(*) as total
FROM translations
GROUP BY language
ORDER BY language;

-- Verificar si hay claves específicas
SELECT language, key, value
FROM translations
WHERE key IN (
    'tech_companies.title',
    'tech_companies.new_company',
    'partners.title',
    'partners.new_partner',
    'common.loading'
)
ORDER BY language, key;

-- Insertar traducciones de prueba si no existen
INSERT INTO translations (key, language, value)
VALUES 
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

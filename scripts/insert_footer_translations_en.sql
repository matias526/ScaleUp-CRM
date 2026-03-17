-- Verificar si existen las traducciones en inglés para el footer
DO $$
BEGIN
    -- Insertar traducciones en inglés si no existen
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'footer.rights' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('footer.rights', 'en', 'All rights reserved');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'footer.privacy' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('footer.privacy', 'en', 'Privacy Policy');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'footer.terms' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('footer.terms', 'en', 'Terms and Conditions');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'footer.help' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('footer.help', 'en', 'Help');
    END IF;
    
    -- Verificar que las traducciones en español también existen
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'footer.rights' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('footer.rights', 'es', 'Todos los derechos reservados');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'footer.privacy' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('footer.privacy', 'es', 'Política de privacidad');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'footer.terms' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('footer.terms', 'es', 'Términos y condiciones');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'footer.help' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('footer.help', 'es', 'Ayuda');
    END IF;
END $$;

-- Verificar que las traducciones se insertaron correctamente
SELECT key, language, value FROM translations 
WHERE key IN ('footer.rights', 'footer.privacy', 'footer.terms', 'footer.help')
ORDER BY language, key;

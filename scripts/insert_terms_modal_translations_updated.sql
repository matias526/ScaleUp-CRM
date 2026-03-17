-- Insertar traducciones para términos y condiciones
INSERT INTO translations (language_code, translation_key, translation_value)
VALUES
-- Español
('es', 'terms.title', 'Términos y Condiciones'),
('es', 'common.close', 'Cerrar'),

-- Inglés
('en', 'terms.title', 'Terms and Conditions'),
('en', 'common.close', 'Close'),

-- Portugués
('pt', 'terms.title', 'Termos e Condições'),
('pt', 'common.close', 'Fechar')
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET translation_value = EXCLUDED.translation_value;

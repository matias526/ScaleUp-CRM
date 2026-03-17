-- Insertar traducciones para el modal de términos y condiciones
INSERT INTO translations (language_code, translation_key, translation_value)
VALUES
-- Español
('es', 'common.close', 'Cerrar'),
('es', 'terms.title', 'Términos y Condiciones'),

-- Inglés
('en', 'common.close', 'Close'),
('en', 'terms.title', 'Terms and Conditions')

ON CONFLICT (language_code, translation_key) 
DO UPDATE SET translation_value = EXCLUDED.translation_value;

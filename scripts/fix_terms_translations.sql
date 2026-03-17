-- Corregir traducciones faltantes para términos y condiciones
INSERT INTO translations (language_code, translation_key, translation_value)
VALUES
-- Español
('es', 'terms.acceptCheckbox', 'He leído y acepto los Términos y Condiciones'),
('es', 'terms.acceptButton', 'Acepto los Términos y Condiciones'),
('es', 'common.processing', 'Procesando...'),

-- Inglés
('en', 'terms.acceptCheckbox', 'I have read and accept the Terms and Conditions'),
('en', 'terms.acceptButton', 'I Accept the Terms and Conditions'),
('en', 'common.processing', 'Processing...'),

-- Portugués
('pt', 'terms.acceptCheckbox', 'Li e aceito os Termos e Condições'),
('pt', 'terms.acceptButton', 'Aceito os Termos e Condições'),
('pt', 'common.processing', 'Processando...')
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET translation_value = EXCLUDED.translation_value;

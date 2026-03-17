-- Insertar traducciones para términos y condiciones
INSERT INTO translations (language_code, translation_key, translation_value)
VALUES
-- Español
('es', 'terms.title', 'Términos y Condiciones'),
('es', 'terms.acceptButton', 'Acepto los Términos y Condiciones'),
('es', 'terms.acceptCheckbox', 'He leído y acepto los Términos y Condiciones'),
('es', 'terms.scrollToAccept', 'Por favor, desplácese hasta el final para aceptar'),
('es', 'terms.success.title', 'Términos aceptados'),
('es', 'terms.success.description', 'Has aceptado los términos y condiciones correctamente'),
('es', 'terms.error.title', 'Error'),
('es', 'terms.error.mustAccept', 'Debes aceptar los términos y condiciones para continuar'),
('es', 'terms.error.acceptFailed', 'No se pudieron aceptar los términos. Por favor, inténtalo de nuevo'),

-- Inglés
('en', 'terms.title', 'Terms and Conditions'),
('en', 'terms.acceptButton', 'I Accept the Terms and Conditions'),
('en', 'terms.acceptCheckbox', 'I have read and accept the Terms and Conditions'),
('en', 'terms.scrollToAccept', 'Please scroll to the bottom to accept'),
('en', 'terms.success.title', 'Terms Accepted'),
('en', 'terms.success.description', 'You have successfully accepted the terms and conditions'),
('en', 'terms.error.title', 'Error'),
('en', 'terms.error.mustAccept', 'You must accept the terms and conditions to continue'),
('en', 'terms.error.acceptFailed', 'Could not accept terms. Please try again'),

-- Portugués
('pt', 'terms.title', 'Termos e Condições'),
('pt', 'terms.acceptButton', 'Aceito os Termos e Condições'),
('pt', 'terms.acceptCheckbox', 'Li e aceito os Termos e Condições'),
('pt', 'terms.scrollToAccept', 'Por favor, role até o final para aceitar'),
('pt', 'terms.success.title', 'Termos aceitos'),
('pt', 'terms.success.description', 'Você aceitou os termos e condições com sucesso'),
('pt', 'terms.error.title', 'Erro'),
('pt', 'terms.error.mustAccept', 'Você deve aceitar os termos e condições para continuar'),
('pt', 'terms.error.acceptFailed', 'Não foi possível aceitar os termos. Por favor, tente novamente')
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET translation_value = EXCLUDED.translation_value;

-- Insertar traducciones del footer en español
INSERT INTO translations (key, language, value)
VALUES 
  ('footer.rights', 'es', 'Todos los derechos reservados'),
  ('footer.privacy', 'es', 'Política de privacidad'),
  ('footer.terms', 'es', 'Términos y condiciones'),
  ('footer.help', 'es', 'Ayuda')
ON CONFLICT (key, language) 
DO UPDATE SET value = EXCLUDED.value;

-- Insertar traducciones del footer en inglés
INSERT INTO translations (key, language, value)
VALUES 
  ('footer.rights', 'en', 'All rights reserved'),
  ('footer.privacy', 'en', 'Privacy Policy'),
  ('footer.terms', 'en', 'Terms and Conditions'),
  ('footer.help', 'en', 'Help')
ON CONFLICT (key, language) 
DO UPDATE SET value = EXCLUDED.value;

-- Insertar traducciones del footer en portugués (si es necesario)
INSERT INTO translations (key, language, value)
VALUES 
  ('footer.rights', 'pt', 'Todos os direitos reservados'),
  ('footer.privacy', 'pt', 'Política de Privacidade'),
  ('footer.terms', 'pt', 'Termos e Condições'),
  ('footer.help', 'pt', 'Ajuda')
ON CONFLICT (key, language) 
DO UPDATE SET value = EXCLUDED.value;

-- Traducciones para la opción de campos personalizados en el menú
INSERT INTO translations (key, language, value) VALUES
('sidebar.settings.custom_fields', 'es', 'Campos personalizados'),
('sidebar.settings.custom_fields', 'en', 'Custom Fields'),
('sidebar.settings.custom_fields', 'pt', 'Campos personalizados')
ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;

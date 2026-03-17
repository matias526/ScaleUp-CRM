-- Traducciones para los nuevos tipos de campo
INSERT INTO translations (key, language, value) VALUES
-- Multiselect
('opportunity_tech_fields.field_type.multiselect', 'es', 'Selección múltiple'),
('opportunity_tech_fields.field_type.multiselect', 'en', 'Multiple selection'),
('opportunity_tech_fields.field_type.multiselect', 'pt', 'Seleção múltipla'),

-- File
('opportunity_tech_fields.field_type.file', 'es', 'Archivo adjunto'),
('opportunity_tech_fields.field_type.file', 'en', 'File attachment'),
('opportunity_tech_fields.field_type.file', 'pt', 'Arquivo anexo'),

-- Traducciones adicionales para la funcionalidad de archivos
('opportunity_tech_fields.file_upload', 'es', 'Subir archivo'),
('opportunity_tech_fields.file_upload', 'en', 'Upload file'),
('opportunity_tech_fields.file_upload', 'pt', 'Carregar arquivo'),

('opportunity_tech_fields.file_types', 'es', 'Tipos de archivo permitidos'),
('opportunity_tech_fields.file_types', 'en', 'Allowed file types'),
('opportunity_tech_fields.file_types', 'pt', 'Tipos de arquivo permitidos'),

('opportunity_tech_fields.file_size', 'es', 'Tamaño máximo'),
('opportunity_tech_fields.file_size', 'en', 'Maximum size'),
('opportunity_tech_fields.file_size', 'pt', 'Tamanho máximo'),

('opportunity_tech_fields.file_preview', 'es', 'Vista previa'),
('opportunity_tech_fields.file_preview', 'en', 'Preview'),
('opportunity_tech_fields.file_preview', 'pt', 'Pré-visualização'),

('opportunity_tech_fields.file_download', 'es', 'Descargar'),
('opportunity_tech_fields.file_download', 'en', 'Download'),
('opportunity_tech_fields.file_download', 'pt', 'Baixar'),

('opportunity_tech_fields.file_remove', 'es', 'Eliminar archivo'),
('opportunity_tech_fields.file_remove', 'en', 'Remove file'),
('opportunity_tech_fields.file_remove', 'pt', 'Remover arquivo'),

('opportunity_tech_fields.file_drag', 'es', 'Arrastra y suelta archivos aquí o haz clic para seleccionar'),
('opportunity_tech_fields.file_drag', 'en', 'Drag and drop files here or click to select'),
('opportunity_tech_fields.file_drag', 'pt', 'Arraste e solte arquivos aqui ou clique para selecionar')

ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;
